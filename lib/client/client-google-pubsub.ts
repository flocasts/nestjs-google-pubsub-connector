import {
    CreateSubscriptionOptions,
    ExistsResponse,
    PubSub,
    Subscription,
    Topic,
} from '@google-cloud/pubsub';
import { Injectable } from '@nestjs/common';
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { from, fromEvent, Observable, of, OperatorFunction, throwError } from 'rxjs';
import { map, mapTo, mergeMap } from 'rxjs/operators';
import { GOOGLE_PUBSUB_SUBSCRIPTION_MESSAGE_EVENT } from '../constants';
import {
    ClientHealthInfo,
    GooglePubSubMessage,
    GooglePubSubOptions,
    GooglePubSubSubscription,
    GooglePubSubTopic,
} from '../interfaces';

/**
 * Proxy for the Google PubSub client
 */
@Injectable()
export class ClientGooglePubSub extends ClientProxy {
    private googlePubSubClient: PubSub;

    constructor(options?: GooglePubSubOptions) {
        super();
        this.googlePubSubClient = options?.pubSubClient ?? new PubSub(options?.pubSubClientConfig);
    }

    /**
     * Since the client on starts listening for messages when event subscribers are added, this
     * method does nothing
     * @returns
     */
    public connect(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Terminates the underlying gRPC channel for the PubSub client
     */
    public close(): Observable<void> {
        return from(this.googlePubSubClient.close());
    }

    /**
     * Publishes the buffer to the supplied Topic
     * @param topic
     * @param data
     * @returns
     */
    public publishToTopic(topic: string, data: Buffer): Observable<string> {
        return this.emit(topic, data);
    }

    /**
     * Get a Subscription instance from the PubSub client. If a Subscription instance is supplied
     * then the returned Subscription will point to the same instance.
     * @param _subscription
     * @returns
     */
    public getSubscription(
        _subscription: string | GooglePubSubSubscription,
    ): GooglePubSubSubscription {
        if (this.isSubscriptionInstance(_subscription)) {
            return _subscription;
        } else {
            return this.googlePubSubClient.subscription(_subscription);
        }
    }

    /**
     * Returns a boolean indicating if the requested Subscription exists
     * @param subscription
     * @returns
     */
    public subscriptionExists(
        subscription: string | GooglePubSubSubscription,
    ): Observable<boolean> {
        return from(this.getSubscription(subscription).exists()).pipe(this.parseExistsResponse);
    }

    /**
     * Attempts to create a Subscription instance belonging to the provided Topic
     * @param _subscription
     * @param _topic
     * @returns
     */
    public createSubscription(
        _subscription: string | GooglePubSubSubscription,
        _topic?: string | GooglePubSubTopic,
        createSubscriptionOptions?: CreateSubscriptionOptions,
    ): Observable<GooglePubSubSubscription | null> {
        const subscription = this.getSubscription(_subscription);

        if (subscription.topic == null && _topic == null) return of(null);

        const topic = this.getTopic(subscription.topic ?? _topic!);
        return from(topic.createSubscription(subscription.name, createSubscriptionOptions)).pipe(
            map((subscriptionResponse) => subscriptionResponse[0]),
            mergeMap((resp) => {
                if (resp === undefined) {
                    return throwError(
                        'Empty response when creating subscription: ' + subscription.name,
                    );
                }
                return of(resp);
            }),
        );
    }

    /**
     * Attempts to delete a Subscription instance
     * @param subscription
     * @returns
     */
    public deleteSubscription(subscription: string | GooglePubSubSubscription): Observable<void> {
        return from(this.getSubscription(subscription).delete()).pipe(mapTo(void 0));
    }

    /**
     * Register a listener for from `message` events on the PubSub client for the
     * supplied subscription
     * @param subscription
     * @returns
     */
    public listenForMessages(
        subscription: string | GooglePubSubSubscription,
    ): Observable<GooglePubSubMessage> {
        return fromEvent(
            this.getSubscription(subscription),
            GOOGLE_PUBSUB_SUBSCRIPTION_MESSAGE_EVENT,
        );
    }

    /**
     * Get a Topic instance from the PubSub client. If a Topic instance is supplied
     * then the returned Topic will point to the same instance.
     * @param _topic
     * @returns
     */
    public getTopic(_topic: string | GooglePubSubTopic): GooglePubSubTopic {
        if (this.isTopicInstance(_topic)) {
            return _topic;
        } else {
            return this.googlePubSubClient.topic(_topic);
        }
    }

    /**
     * Returns a boolean indicating if the requested Topic exists
     * @param subscription
     * @returns
     */
    public topicExists(topic: string | GooglePubSubTopic): Observable<boolean> {
        return from(this.getTopic(topic).exists()).pipe(this.parseExistsResponse);
    }

    /**
     * Attempts to create a new Topic instance
     * @param _subscription
     * @param _topic
     * @returns
     */
    public createTopic(topic: string | GooglePubSubTopic): Observable<GooglePubSubTopic> {
        return from(this.getTopic(topic).create()).pipe(map((topicResponse) => topicResponse[0]));
    }

    /**
     * Attempts to delete a Topic instance
     * @param topic
     * @returns
     */
    public deleteTopic(topic: string | GooglePubSubTopic): Observable<void> {
        return from(this.getTopic(topic).delete()).pipe(mapTo(void 0));
    }

    /**
     * Returns client health information
     * @returns
     */
    public getHealth(): ClientHealthInfo {
        return {
            isOpen: this.googlePubSubClient.isOpen,
            isEmulator: this.googlePubSubClient.isEmulator,
            projectId: this.googlePubSubClient.projectId,
        };
    }

    /**
     * Dispatch an outgoing message event
     * @param packet
     * @returns
     */
    protected dispatchEvent(packet: ReadPacket<Buffer>): Promise<any> {
        const topic = packet.pattern;
        return this.googlePubSubClient.topic(topic).publish(packet.data);
    }

    /**
     * Parses the response from a `.exists()` call on either a Topic or Subscription
     */
    private parseExistsResponse: OperatorFunction<ExistsResponse, boolean> = map(
        (existsResponse: ExistsResponse) => existsResponse[0],
    );

    /**
     * Indicates if the provided value is a Topic instance
     * @param topic
     */
    private isTopicInstance(topic?: GooglePubSubTopic | string | null): topic is GooglePubSubTopic {
        return topic instanceof Topic;
    }

    /**
     * Indicates if the provided value is a Subscription instance
     * @param subscription
     */
    private isSubscriptionInstance(
        subscription?: GooglePubSubSubscription | string | null,
    ): subscription is GooglePubSubSubscription {
        return subscription instanceof Subscription;
    }

    /**
     * This refers to an internal publish method to NestJS, please use `publishToTopic`.
     */
    protected publish(packet: ReadPacket<any>, callback: (packet: WritePacket<any>) => void): any {
        throw new Error('Method intentionally not implemented.');
    }
}
