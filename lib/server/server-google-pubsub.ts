import { Logger } from '@nestjs/common';
import { CustomTransportStrategy, ReadPacket, Server } from '@nestjs/microservices';
import { from, merge, Observable, of, Subscription } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ClientGooglePubSub } from '../client';
import { GooglePubSubContext as GooglePubSubContext } from '../ctx-host/google-pubsub.context';
import { GooglePubSubMessageDeserializer } from '../deserializers';
import { InvalidPatternMetadataException } from '../errors';
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
     * @param pattern - The pattern from the \@GooglePubSubMessageHandler decorator
     */
    private async getSubscriptionFromPattern(pattern: string): Promise<void> {
        let metadata: GooglePubSubPatternMetadata | null;
        try {
            metadata = JSON.parse(pattern);
        } catch (error) {
            metadata = null;
        }

        if (metadata == null || !(metadata.subscriptionName || metadata.topicName)) {
            throw new InvalidPatternMetadataException(pattern);
        }

        let subscription: GooglePubSubSubscription | null = null;

        const subscriptionExists: boolean = metadata.subscriptionName
            ? await this.googlePubSubClient
                  .subscriptionExists(metadata.subscriptionName)
                  .toPromise()
            : false;
        if (metadata.subscriptionName && subscriptionExists) {
            subscription = this.googlePubSubClient.getSubscription(metadata.subscriptionName);
        } else if (this.createSubscriptions) {
            if (!metadata.topicName) {
                throw new InvalidPatternMetadataException(pattern);
            }
            let topic: GooglePubSubTopic;
            const topicName = this.topicNamingStrategy.generateTopicName(metadata.topicName);
            const topicExists: boolean = topicName
                ? await this.googlePubSubClient.topicExists(topicName).toPromise()
                : false;
            if (topicExists) {
                const subscriptionName: string =
                    metadata.subscriptionName ||
                    this.subscriptionNamingStrategy.generateSubscriptionName(
                        topicName,
                        metadata.subscriptionName,
                    );
                topic = this.googlePubSubClient.getTopic(topicName);
                subscription = await this.googlePubSubClient
                    .createSubscription(subscriptionName, topic)
                    .toPromise();
            }
        }

        if (subscription) {
            this.logger.log(`Mapped {${subscription.name}} handler`);
            this.subscriptions.set(pattern, subscription);
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
    ]): Observable<[AckFunction, NackFunction, GooglePubSubContext]> => {
        return of(this.getHandlerByPattern(pattern)).pipe(
            mergeMap((handler) => {
                if (handler == null)
                    throw Error('Transport Error: Handler should never be nullish.');
                return from(handler(packet, ctx)).pipe(
                    mergeMap((i) => this.transformToObservable(i)),
                );
            }),
            catchError((err) => {
                return of(err);
            }),
            map<unknown, [AckFunction, NackFunction, GooglePubSubContext]>((err) => {
                if (err) {
                    this.nackStrategy.nack(
                        err,
                        packet.data.ack.bind(packet.data),
                        packet.data.nack.bind(packet.data),
                        ctx,
                    );
                } else {
                    this.ackStrategy.ack(
                        packet.data.ack.bind(packet.data),
                        packet.data.nack.bind(packet.data),
                        ctx,
                    );
                }
                return [packet.data.ack.bind(packet.data), packet.data.nack.bind(packet.data), ctx];
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
}
