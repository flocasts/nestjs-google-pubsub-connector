import {
    Message as GooglePubSubMessage,
    PubSub as GooglePubSub,
    Subscription as GooglePubSubSubscription,
} from '@google-cloud/pubsub';
import { CustomTransportStrategy, MessageHandler, Server, WritePacket } from '@nestjs/microservices';
import { GOOGLE_PUBSUB_SUBSCRIPTION_MESSAGE_EVENT } from '../constants';
import { GooglePubSubContext as GooglePubSubContext } from '../ctx-host/google-pubsub.context';
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

    private readonly subscriptionNamingStrategy: SubscriptionNamingStrategy;

    constructor(options?: GooglePubSubTransportOptions) {
        super();
        this.googlePubSubClient = options?.client || new GooglePubSub();
        this.subscriptionNamingStrategy = options?.subscriptionNamingStrategy || identitySubscriptionNamingStrategy;
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
                // If we're dealing with an @Topic handler, pass the topic name though the
                // naming strategy to get the subscriptions name
                // case GooglePubSubPatternHandler.TOPIC:
                //     this.logger.log(`Mapped {${pattern}, TOPIC} route"`)
                //     const subscriptionName = this.subscriptionNamingStrategy(
                //         pattern,
                //     );
                //     subscription = this.googlePubSubClient.subscription(
                //         subscriptionName,
                //     );
                //     break;
            }

            if (subscription) {
                subscription.on(
                    GOOGLE_PUBSUB_SUBSCRIPTION_MESSAGE_EVENT,
                    this.handleGooglePubSubMessageEvent(handler, pattern),
                );
            }
        });
    }

    private handleGooglePubSubMessageEvent(handler: GooglePubSubMessageHandler, pattern: string) {
        return (message: GooglePubSubMessage) => {
            // Create our context object
            const ctx = new GooglePubSubContext([message, pattern, false]);
            const data = JSON.parse(message.data.toString());

            // Transform whatever we get back from the handler into an observable
            // N.B. we do this because the NestJS internals plays better with observables
            // than raw values
            // @ts-ignore
            const response$ = this.transformToObservable(handler(data, ctx));

            // If a requester uses the @Ack param decorator we'll unset the auto ack value
            // and assume that they'll ack themselves
            const shouldAck = (ctx: GooglePubSubContext) => ctx.getAutoAck();

            // This will be called when the response$ observable completes
            const respond = async (packet: WritePacket): Promise<void | Promise<void>> => {
                if (packet.err) {
                    this.handleError(packet.err);
                }
                if (shouldAck(ctx)) {
                    await message.ack();
                }
            };

            // If our handler returned anything, pass it to `this.send` where `respond` will
            // be called with the response$ observable completes
            response$ && this.send(response$, respond);
        };
    }

    /**
     * This is called on transport close by the NestJS internals
     */
    public close(): Promise<void> {
        return this.googlePubSubClient.close();
    }
}
