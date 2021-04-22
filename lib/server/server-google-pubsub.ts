import { Logger } from '@nestjs/common';
import {
    CustomTransportStrategy,
    MessageHandler,
    MsPattern,
    ReadPacket,
    Server,
} from '@nestjs/microservices';
import { from, merge, Observable, of, Subscription } from 'rxjs';
import { catchError, map, mapTo, mergeMap } from 'rxjs/operators';
import { ClientGooglePubSub } from '../client';
import { GooglePubSubContext as GooglePubSubContext } from '../ctx-host/google-pubsub.context';
import { GooglePubSubMessageDeserializer } from '../deserializers';
import { InvalidPatternMetadataException } from '../errors';
import { TransportError } from '../errors/transport-error.exception';
import {
    AckFunction,
    AckStrategy,
    GooglePubSubMessage,
    GooglePubSubPatternMetadata,
    GooglePubSubSubscription,
    GooglePubSubTopic,
    GooglePubSubTransportOptions,
    NackFunction,
    NackStrategy,
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

    /**
     * GooglePubSubSubscriptions keyed by pattern
     */
    private readonly subscriptions: Map<string, GooglePubSubSubscription> = new Map();

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

        // Pass every emitted event through the same pipeline
        this.listenerSubscription = merge(...listeners)
            .pipe(map(this.deserializeAndAddContext), mergeMap(this.handleMessage))
            .subscribe();
        callback();
    }

    /**
     * Resolve subscriptions and create them if `createSubscription` is true
     * Basic logic is as follows:
     *   If a subscription name is provided and that subscription exists, use it
     *   If a subscription name is provided and it does not exist, attempt to create it and use it
     *       If a topic name is provided and that topic exists, create our subscription
     *       If a topic name was not provided OR the topic does not exist, throw an error
     * @param pattern - The pattern from the \@GooglePubSubMessageHandler decorator
     */
    private async getSubscriptionFromPattern(pattern: string): Promise<void> {
        // Parse out our metadata from the pattern
        let metadata: GooglePubSubPatternMetadata | null;
        try {
            metadata = JSON.parse(pattern);
        } catch (error) {
            metadata = null;
        }

        if (metadata == null || !(metadata.subscriptionName || metadata.topicName)) {
            throw new InvalidPatternMetadataException(pattern);
        }

        // This, ideally, will hold the subscription we're about to instantiate/create
        let subscription: GooglePubSubSubscription | null = null;
        const subscriptionName: string = this.subscriptionNamingStrategy.generateSubscriptionName(
            metadata.topicName,
            metadata.subscriptionName,
        );

        const subscriptionExists: boolean = await this.googlePubSubClient
            .subscriptionExists(subscriptionName)
            .toPromise();

        // If our subscription exists, then we're good
        if (subscriptionExists) {
            subscription = this.googlePubSubClient.getSubscription(subscriptionName);
            // If it doesn't, and we're set to create subscriptions then let's do so
        } else if (this.createSubscriptions) {
            // Subscriptions are created from topics, so if we don't have a topic name set then
            // throw an error
            if (!metadata.topicName) {
                throw new InvalidPatternMetadataException(pattern);
            }

            // Get our topic name and check if it exists
            const topicName = this.topicNamingStrategy.generateTopicName(metadata.topicName);
            const topicExists: boolean = await this.googlePubSubClient
                .topicExists(topicName)
                .toPromise();

            // If our topic exists, use it to create our subscription
            if (topicExists) {
                subscription = await this.googlePubSubClient
                    .createSubscription(subscriptionName, topicName)
                    .toPromise();
            // If it doesn't exist then throw - we don't want to start with missing topics
            } else {
                throw new TransportError(
                    `Topic ${topicName} does not exist, cannot create subscription ${subscriptionName}`,
                    pattern,
                    Array.from(this.messageHandlers.keys()),
                );
            }
        }

        // Either add our subscription or throw if we don't have it
        if (subscription) {
            this.logger.log(`Mapped {${subscription.name}} handler`);
            this.subscriptions.set(pattern, subscription);
        } else {
            // This code should never be reached, but let's throw if it is.
            throw new TransportError(
                `Subscription ${subscriptionName} was not created`,
                pattern,
                Array.from(this.messageHandlers.keys()),
            );
        }
    }

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
