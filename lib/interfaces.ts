import { Message, Subscription, Topic } from '@google-cloud/pubsub';
import { ClientGooglePubSub } from './client';
import { GooglePubSubContext } from './ctx-host';

export type GooglePubSubMessage = Message;
export type GooglePubSubTopic = Topic;
export type GooglePubSubSubscription = Subscription;
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

export type GenerateSubscriptionName = (subscriptionName: string) => string;
export interface SubscriptionNamingStrategy {
    generateSubscriptionName: GenerateSubscriptionName;
}

export type AckHandler = (
    ack: () => void,
    nack: () => void,
    ctx: GooglePubSubContext,
) => Promise<void>;

export interface AckStrategy {
    ack: AckHandler;
}

export type NackHandler = (
    error: Error,
    ack: () => void,
    nack: () => void,
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
