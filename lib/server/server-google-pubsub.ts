import { CreateSubscriptionOptions } from '@google-cloud/pubsub';
import { Logger } from '@nestjs/common';
import { CustomTransportStrategy, MessageHandler, ReadPacket, Server } from '@nestjs/microservices';
import { firstValueFrom, from, merge, Observable, of, Subscription } from 'rxjs';
import { catchError, map, mapTo, mergeMap } from 'rxjs/operators';
import { ClientGooglePubSub } from '../client';
import { GooglePubSubContext as GooglePubSubContext } from '../ctx-host/google-pubsub.context';
import { GooglePubSubMessageDeserializer } from '../deserializers';
import { InvalidPatternMetadataException } from '../errors';
import { TransportError } from '../errors/transport-error.exception';
import {
    AckStrategy,
    GooglePubSubMessage,
    GooglePubSubPatternMetadata,
    GooglePubSubSubscription,
    GooglePubSubTopic,
    GooglePubSubTransportOptions,
    NackStrategy,
    NamingDependencyTag,
    SubscriptionNameDependencies,
    SubscriptionNamingStrategy,
    TopicNamingStrategy,
} from '../interfaces';
import { BasicAckStrategy } from '../strategies/basic-ack.strategy';
import { BasicNackStrategy } from '../strategies/basic-nack.strategy';
import { BasicSubscriptionNamingStrategy } from '../strategies/basic-subscription-naming-strategy';
import { BasicTopicNamingStrategy } from '../strategies/basic-topic-naming-strategy';

export class GooglePubSubTransport extends Server implements CustomTransportStrategy {
    /**
     * Logger
     */
    protected readonly logger = new Logger('GooglePubSubTransport');

    /**
     * Convert the incoming message into a ReadPacket
     */
    protected readonly deserializer: GooglePubSubMessageDeserializer;

    /**
     * Google PubSub client handle
     */
    private readonly googlePubSubClient: ClientGooglePubSub;

    /**
     * This function will be used to determine subscription names when only a topic name is given
     */
    private readonly subscriptionNamingStrategy: SubscriptionNamingStrategy;

    /**
     * Modifies topic names dynamically
     */
    private readonly topicNamingStrategy: TopicNamingStrategy;

    /**
     * This function is called after an incoming message is handled and allows control over when/how
     * a message is either acked or nacked
     */
    private readonly ackStrategy: AckStrategy;

    /**
     * This function is called after an incoming message encounters an and allows control over
     * when/how a message is either acked or nacked
     */
    private readonly nackStrategy: NackStrategy;

    /**
     * Whether to create subscriptions that do not already exist
     */
    private readonly createSubscriptions: boolean;

    /**
     * Whether to automatically ack handled messages
     */
    private readonly autoAck: boolean;

    /**
     * Whether to automatically nack rejected messages
     */
    private readonly autoNack: boolean;

    /**
     * Subscription for all message listeners
     */
    private listenerSubscription: Subscription | null = null;

    private iterators: [string, AsyncGenerator<GooglePubSubMessage[]>][] | null = null;
    /**
     * GooglePubSubSubscriptions keyed by pattern
     */
    private readonly subscriptions: Map<string, GooglePubSubSubscription> = new Map();

    /**
     * Subscription Iterators for one-at-a-time processing keyed by pattern
     */
    private readonly synchronousSubscriptions: Map<string, GooglePubSubSubscription> = new Map();

    constructor(options?: GooglePubSubTransportOptions) {
        super();
        this.googlePubSubClient = options?.client ?? new ClientGooglePubSub();
        this.createSubscriptions = options?.createSubscriptions ?? false;
        this.autoAck = options?.autoAck ?? true;
        this.autoNack = options?.autoNack ?? false;
        this.subscriptionNamingStrategy =
            options?.subscriptionNamingStrategy ?? new BasicSubscriptionNamingStrategy();
        this.topicNamingStrategy = options?.topicNamingStrategy ?? new BasicTopicNamingStrategy();
        this.ackStrategy = options?.ackStrategy ?? new BasicAckStrategy();
        this.nackStrategy = options?.nackStrategy ?? new BasicNackStrategy();
        this.deserializer = new GooglePubSubMessageDeserializer();
    }

    public listen(callback: () => void): void {
        this.bindHandlers(callback);
    }

    /**
     * Pull messages from the subscription iterators marked with {@link oneAtATime}
     */
    private startPullSyncMessages() {
        if (this.iterators) {
            this.iterators.map((iterator) => this.handleMessageSync(iterator));
        }
    }

    /**
     * Bind message handlers to subscription instances
     * @param callback - The callback to be invoked when all handlers have been bound
     */
    private async bindHandlers(callback: () => void) {
        // Set up our subscriptions from any decorated topics
        await from(this.messageHandlers)
            .pipe(mergeMap(([pattern]) => this.getSubscriptionFromPattern(pattern)))
            .toPromise();

        // Group all of our event listeners into an array
        const listeners = Array.from(this.subscriptions, this.subscribeMessageEvent);

        this.listenerSubscription = merge(...listeners)
            .pipe(map(this.deserializeAndAddContext), mergeMap(this.handleMessage))
            .subscribe();
        this.iterators = Array.from(
            this.synchronousSubscriptions,
            this.getSubscriptionIterator,
            this,
        );

        //for one at a time messages, pull events from their iterators and handle them
        // synchronously
        this.startPullSyncMessages();
        callback();
    }

    /**
     * Resolve subscriptions and create them if `createSubscription` is true
     * @param pattern - The pattern from the \@GooglePubSubMessageHandler decorator
     */
    private async getSubscriptionFromPattern(pattern: string): Promise<void> {
        const metadata = this.parsePattern(pattern);

        const subscriptionName: string = this.getSubscriptionName(metadata, pattern);

        const subscription: GooglePubSubSubscription | null = await this.getOrCreateSubscription(
            subscriptionName,
            metadata.topicName,
            metadata.createOptions,
            pattern,
        );

        if (subscription) {
            this.logger.log(`Mapped {${subscription.name}} handler`);
            if (metadata.oneAtATime) {
                this.synchronousSubscriptions.set(pattern, subscription);
            } else {
                this.subscriptions.set(pattern, subscription);
            }
        }
    }

    /**
     * Parse a metadata pattern, throwing an exception if it cannot be parsed.
     *
     * @throws InvalidPatternMetadataException
     * Thrown if the JSON pattern cannot be parsed.
     */
    private parsePattern = (pattern: string): GooglePubSubPatternMetadata => {
        try {
            return JSON.parse(pattern);
        } catch (error) {
            throw new InvalidPatternMetadataException(pattern);
        }
    };

    /**
     * Get the name for the subscription based on the given metadata.
     *
     * @throws InvalidPatternMetadataException
     * This exception is thrown if a subscription name cannot be generated.
     */
    private getSubscriptionName = (
        metadata: GooglePubSubPatternMetadata,
        pattern: string,
    ): string => {
        const subscriptionNameDeps = GooglePubSubTransport.createSubscriptionNameDependencies(
            metadata,
            pattern,
        );

        return this.subscriptionNamingStrategy.generateSubscriptionName(subscriptionNameDeps);
    };

    /**
     * Create the dependency object for producing a subscription name.
     *
     * @throws InvalidPatternMetadataException
     * Thrown if `topicName` and `subscriptionName` are both `undefined`.
     */
    private static createSubscriptionNameDependencies(
        metadata: GooglePubSubPatternMetadata,
        pattern: string,
    ): SubscriptionNameDependencies {
        const topicName: string | undefined = metadata.topicName;
        const subscriptionName: string | undefined = metadata.subscriptionName;

        if (topicName && subscriptionName) {
            return {
                _tag: NamingDependencyTag.TOPIC_AND_SUBSCRIPTION_NAMES,
                topicName,
                subscriptionName,
            };
        }

        if (topicName) {
            return {
                _tag: NamingDependencyTag.TOPIC_NAME_ONLY,
                topicName,
            };
        }

        if (subscriptionName) {
            return {
                _tag: NamingDependencyTag.SUBSCRIPTION_NAME_ONLY,
                subscriptionName,
            };
        }

        throw new InvalidPatternMetadataException(pattern);
    }

    /**
     * Get the subscription from the pattern metadata.
     *
     * @remarks
     * If PubSub Client cannot create the subscription, or if the application is not configured to
     * create subscriptions, this method will return null when the subscription does not already
     * exist.
     *
     * @throws InvalidPatternMetadataException
     * Thrown if attempting to create a subscription, but a topic name is not provided.
     */
    private getOrCreateSubscription = async (
        subscriptionName: string,
        topicName: string | undefined,
        createOptions: CreateSubscriptionOptions | undefined,
        pattern: string,
    ): Promise<GooglePubSubSubscription | null> => {
        const subscriptionExists: boolean = (await this.googlePubSubClient
            .subscriptionExists(subscriptionName)
            .toPromise()) as boolean;

        if (subscriptionExists) return this.googlePubSubClient.getSubscription(subscriptionName);

        if (!this.createSubscriptions) return null;

        if (!topicName) {
            throw new InvalidPatternMetadataException(pattern);
        }

        const _topicName = this.topicNamingStrategy.generateTopicName(topicName);
        const topic: GooglePubSubTopic | null = this.googlePubSubClient.getTopic(_topicName);

        return (await this.googlePubSubClient
            .createSubscription(subscriptionName, topic, createOptions)
            .toPromise()) as GooglePubSubSubscription | null;
    };

    /**
     * Subscribe to a Subscription and include pattern with each message
     */
    private subscribeMessageEvent = ([pattern, subscription]: [
        string,
        GooglePubSubSubscription,
    ]): Observable<[string, GooglePubSubMessage]> => {
        return this.googlePubSubClient.listenForMessages(subscription).pipe(
            map<GooglePubSubMessage, [string, GooglePubSubMessage]>((message) => [
                pattern,
                message,
            ]),
        );
    };

    /**
     *
     * @param pattern - The subscription pattern
     * @param subscription - The subscription
     * @returns The pattern and an iterator for the subscription
     */
    private getSubscriptionIterator([pattern, subscription]: [string, GooglePubSubSubscription]): [
        string,
        AsyncGenerator<GooglePubSubMessage[]>,
    ] {
        return [pattern, this.googlePubSubClient.getMessageIterator(subscription)];
    }

    /**
     * Convert each message into a ReadPacket and include pattern and Context
     */
    private deserializeAndAddContext = ([pattern, message]: [string, GooglePubSubMessage]): [
        string,
        ReadPacket<GooglePubSubMessage>,
        GooglePubSubContext,
    ] => {
        return [
            pattern,
            this.deserializer.deserialize(message, { metadata: pattern }),
            new GooglePubSubContext([message, pattern, this.autoAck, this.autoNack]),
        ];
    };

    /**
     * Pull messages from the iterator and pass them to the subscription handler
     * @param pattern - The subscription name
     * @param iterator - The message iterator
     */
    private async handleMessageSync([pattern, iterator]: [
        string,
        AsyncGenerator<GooglePubSubMessage[]>,
    ]) {
        for await (const [message] of iterator) {
            if (message) {
                const data = this.deserializeAndAddContext([pattern, message]);
                await firstValueFrom(this.handleMessage(data));
            }
        }
    }

    /**
     * Pass ReadPacket to internal `handleEvent` method
     */
    private handleMessage = ([pattern, packet, ctx]: [
        string,
        ReadPacket<GooglePubSubMessage>,
        GooglePubSubContext,
    ]): Observable<void> => {
        return of(this.getHandlerByPattern(pattern)).pipe(
            mergeMap((handler) => {
                if (handler == null) {
                    throw new TransportError(
                        'Handler should never be nullish.',
                        pattern,
                        Array.from(this.messageHandlers.keys()),
                    );
                }
                return from(handler(packet, ctx)).pipe(
                    mergeMap((i) => this.transformToObservable(i)),
                    mapTo(null),
                );
            }),
            catchError((err) => {
                return of(err);
            }),
            map<unknown, void>((err) => {
                const ack = packet.data.ack.bind(packet.data);
                const nack = packet.data.nack.bind(packet.data);
                if (err) {
                    this.nackStrategy.nack(err, ack, nack, ctx);
                } else {
                    this.ackStrategy.ack(ack, nack, ctx);
                }
            }),
        );
    };

    /**
     * This is called on transport close by the NestJS internals
     */
    public async close(): Promise<void> {
        this.listenerSubscription && this.listenerSubscription.unsubscribe();
        await this.googlePubSubClient.close();
    }

    public getHandlerByPattern(pattern: string): MessageHandler | null {
        return this.messageHandlers.get(pattern) ?? null;
    }
}
