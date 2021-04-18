import {
    Attributes,
    ClientConfig,
    Message,
    PubSub,
    Subscription,
    Topic,
} from '@google-cloud/pubsub';
import { ReadPacket } from '@nestjs/microservices';
import { ClientGooglePubSub } from './client';
import { GooglePubSubContext } from './ctx-host';

export type GooglePubSubMessage = Message;
export type GooglePubSubMessageAttributes = Attributes;
export type GooglePubSubTopic = Topic;
export type GooglePubSubSubscription = Subscription;

export type AckFunction = () => void;
export type NackFunction = () => void;
export interface GooglePubSubSubscriptionPatternMetadata {
    subscriptionName: string;
    topicName?: string;
}
export interface GooglePubSubTopicPatternMetadata {
    subscriptionName?: string;
    topicName: string;
}

export type GooglePubSubPatternMetadata =
    | GooglePubSubSubscriptionPatternMetadata
    | GooglePubSubTopicPatternMetadata;

export interface GooglePubSubTransportOptions {
    client?: ClientGooglePubSub;
    createSubscriptions?: boolean;
    autoAck?: boolean;
    autoNack?: boolean;
    subscriptionNamingStrategy?: SubscriptionNamingStrategy;
    ackStrategy?: AckStrategy;
    nackStrategy?: NackStrategy;
}

export type GenerateSubscriptionName = (topicName: string, subscriptionName?: string) => string;
export interface SubscriptionNamingStrategy {
    generateSubscriptionName: GenerateSubscriptionName;
}

export type AckHandler = (
    ack: AckFunction,
    nack: NackFunction,
    ctx: GooglePubSubContext,
) => Promise<void>;

export interface AckStrategy {
    ack: AckHandler;
}

export type NackHandler<T = unknown> = (
    error: T,
    ack: AckFunction,
    nack: NackFunction,
    ctx: GooglePubSubContext,
) => Promise<void>;

export interface NackStrategy {
    nack: NackHandler;
}

export interface ClientHealthInfo {
    isOpen: boolean;
    isEmulator: boolean;
    projectId: string;
}

export interface GooglePubSubOptions {
    pubSubClient?: PubSub;
    pubSubClientConfig?: ClientConfig;
}

export type PublishData = Buffer | Record<string, any>;

export interface ClientGooglePubSubOutgoingRequestData {
    message: PublishData;
    attributes?: GooglePubSubMessageAttributes;
}

export interface ClientGooglePubSubOutgoingRequestSerializedData extends ReadPacket {
    data: ClientGooglePubSubOutgoingRequestData;
}
