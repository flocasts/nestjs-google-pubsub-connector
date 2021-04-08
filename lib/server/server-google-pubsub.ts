import {
    Message as GooglePubSubMessage,
    PubSub as GooglePubSub,
    Subscription as GooglePubSubSubscription,
} from '@google-cloud/pubsub';
import { Logger } from '@nestjs/common';
import {
    CustomTransportStrategy,
    MessageHandler,
    Server,
    WritePacket,
} from '@nestjs/microservices';
import {
    GOOGLE_PUBSUB_SUBSCRIPTION_ERROR_EVENT,
    GOOGLE_PUBSUB_SUBSCRIPTION_MESSAGE_EVENT,
} from '../constants';
import { GooglePubSubContext as GooglePubSubContext } from '../ctx-host/google-pubsub.context';
import { GooglePubSubMessageDeserializer } from '../deserializers';
import { GooglePubSubPatternHandler } from '../enums';

export type SubscriptionNamingStrategy = (subscriptionName: string) => string;

type GooglePubSubMessageHandler = MessageHandler<Record<string, any>, GooglePubSubContext, void>;

export interface GooglePubSubTransportOptions {
    client?: GooglePubSub;
    subscriptionNamingStrategy: SubscriptionNamingStrategy;
}

export const identitySubscriptionNamingStrategy = (str: string) => str;

export class GooglePubSubTransport extends Server implements CustomTransportStrategy {
    /**
     * Google PubSub client handle
     */
    private readonly googlePubSubClient: GooglePubSub;

    /**
     * Logger
     */
    protected readonly logger = new Logger('GooglePubSubTransport');

    private readonly subscriptions: Map<string, GooglePubSubSubscription> = new Map();

    // private readonly subscriptionNamingStrategy: SubscriptionNamingStrategy;

    constructor(options?: GooglePubSubTransportOptions) {
        super();
        this.googlePubSubClient = options?.client || new GooglePubSub();
        // this.subscriptionNamingStrategy =
        //     options?.subscriptionNamingStrategy || identitySubscriptionNamingStrategy;
        this.deserializer = new GooglePubSubMessageDeserializer();
    }

    public listen(callback: () => void): void {
        this.bindHandlers();
        callback();
    }

    private bindHandlers() {
        this.messageHandlers.forEach((handler: GooglePubSubMessageHandler, pattern: string) => {
            // For the time being we're only going to handle emitting events,
            // no request/response patterns
            if (!handler.isEventHandler) return;

            let subscription: GooglePubSubSubscription;
            const handlerType = GooglePubSubPatternHandler.SUBSCRIPTION;
            switch (handlerType) {
                // If we're dealing with an @Subscription handler, just pass the pattern through
                case GooglePubSubPatternHandler.SUBSCRIPTION:
                    this.logger.log(`Mapped {${pattern}, SUBSCRIPTION} route"`);
                    subscription = this.googlePubSubClient.subscription(pattern);
                    break;
            }

            if (subscription) {
                if (!this.subscriptions.has(pattern)) this.subscriptions.set(pattern, subscription);
                subscription.on(
                    GOOGLE_PUBSUB_SUBSCRIPTION_MESSAGE_EVENT,
                    this.handleMessage(pattern),
                );
                subscription.on(GOOGLE_PUBSUB_SUBSCRIPTION_ERROR_EVENT, (error) =>
                    this.handleError(error),
                );
            }
        });
    }

    public handleMessage(pattern: string) {
        return async (message: GooglePubSubMessage) => {
            // Create our context object
            const ctx = new GooglePubSubContext([message, pattern, true]);
            const packet = this.deserializer.deserialize(message, { pattern });

            const shouldAck = (ctx: GooglePubSubContext) => ctx.getAutoAck();
            try {
                await this.handleEvent(pattern, packet, ctx);
            } catch (error) {
                this.handleError(error);
            } finally {
                if (shouldAck(ctx)) {
                    await message.ack();
                }
            }
        };
    }

    /**
     * This is called on transport close by the NestJS internals
     */
    public async close(): Promise<void> {
        await Promise.all(Array.from(this.subscriptions.values(), (sub) => sub.close()));
        await this.googlePubSubClient.close();
    }
}
