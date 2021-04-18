jest.mock('@google-cloud/pubsub');
import { PubSub, Subscription, Topic } from '@google-cloud/pubsub';
import { GooglePubSubTopic } from '../interfaces';
import { ClientGooglePubSub } from './client-google-pubsub';

const topicName = 'project-venison-plans';
const subscriptionName = 'project-v-tem-ray-notifier';
const testMessage = "We're at Side 7";
const testBuffer = Buffer.from(testMessage);

const client: PubSub = new PubSub();
const clientProxy: ClientGooglePubSub = new ClientGooglePubSub({ pubSubClient: client });

const mockedClose = PubSub.prototype.close as jest.MockedFunction<PubSub['close']>;
const mockedPublish = Topic.prototype.publish as jest.MockedFunction<GooglePubSubTopic['publish']>;
const mockedPublishJSON = Topic.prototype.publishJSON as jest.MockedFunction<
    GooglePubSubTopic['publishJSON']
>;
const mockedSubscriptionExists = Subscription.prototype.exists as jest.MockedFunction<
    Subscription['exists']
>;
const mockedSubscriptionCreate = Topic.prototype.createSubscription as jest.MockedFunction<
    Topic['createSubscription']
>;
const mockedSubscriptionDelete = Subscription.prototype.delete as jest.MockedFunction<
    Subscription['delete']
>;

const mockedTopicExists = Topic.prototype.exists as jest.MockedFunction<Topic['exists']>;
const mockedTopicCreate = Topic.prototype.create as jest.MockedFunction<Topic['create']>;
const mockedTopicDelete = Topic.prototype.delete as jest.MockedFunction<Topic['delete']>;

describe('ClientGooglePubSub', () => {
    describe('close', () => {
        it('should call the close method on the PubSub client', async () => {
            await clientProxy.close().toPromise();
            expect(mockedClose).toHaveBeenCalled();
        });
    });

    describe('publishToTopic', () => {
        it('should attempt to publish a Buffer to the provided topic', async () => {
            await clientProxy.publishToTopic(topicName, testBuffer).toPromise();
            expect(client.topic).toHaveBeenLastCalledWith(topicName);
            expect(mockedPublish).toHaveBeenLastCalledWith(testBuffer, undefined);
        });

        it('should attempt to publish an object to the provided topic', async () => {
            const data = { songTitle: "Comin' on" };
            await clientProxy.publishToTopic(topicName, data).toPromise();
            expect(client.topic).toHaveBeenLastCalledWith(topicName);
            expect(mockedPublishJSON).toHaveBeenLastCalledWith(data, undefined);
        });

        it('should attempt to publish an object to the provided topic with message attributes', async () => {
            const data = { songTitle: "Comin' on" };
            const attrs = { bandName: 'The Shamen' };
            await clientProxy.publishToTopic(topicName, data, attrs).toPromise();
            expect(client.topic).toHaveBeenLastCalledWith(topicName);
            expect(mockedPublishJSON).toHaveBeenLastCalledWith(data, attrs);
        });
    });

    describe('getSubscription', () => {
        it('should return a new Subscription instance when supplied with a string', () => {
            const subscription = clientProxy.getSubscription(subscriptionName);
            expect(subscription).toBeInstanceOf(Subscription);
        });

        it('should return the same Subscription instance when supplied with a Subscription instance', () => {
            const subscription = new Subscription(client, subscriptionName);
            const newSubscription = clientProxy.getSubscription(subscription);
            expect(subscription).toBe(newSubscription);
        });
    });

    describe('subscriptionExists', () => {
        it('should call the `.exists` method on the client subscription when given a string', async () => {
            await clientProxy.subscriptionExists(subscriptionName).toPromise();
            expect(mockedSubscriptionExists).toHaveBeenCalled();
        });

        it('should call the `.exists` method on the client subscription when given a Subscription Instance', async () => {
            await clientProxy
                .subscriptionExists(new Subscription(client, subscriptionName))
                .toPromise();
            expect(mockedSubscriptionExists).toHaveBeenCalled();
        });
    });

    describe('createSubscription', () => {
        it('should attempt to create a Subscription when given a subscription name and a topic name', async () => {
            await clientProxy.createSubscription(subscriptionName, topicName).toPromise();
            expect(mockedSubscriptionCreate).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance and a topic name', async () => {
            const subscription = new Subscription(client, subscriptionName);
            await clientProxy.createSubscription(subscription, topicName).toPromise();
            expect(mockedSubscriptionCreate).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance with a topic name set', async () => {
            const subscription = new Subscription(client, subscriptionName);
            subscription.topic = topicName;
            await clientProxy.createSubscription(subscription).toPromise();
            expect(mockedSubscriptionCreate).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance and a topic instance', async () => {
            const subscription = new Subscription(client, subscriptionName);
            subscription.topic = topicName;
            await clientProxy.createSubscription(subscription).toPromise();
            expect(mockedSubscriptionCreate).toHaveBeenCalled();
        });
    });

    describe('deleteSubscription', () => {
        it('should call the `.delete` method on the client subscription when given a string', async () => {
            await clientProxy.deleteSubscription(subscriptionName).toPromise();
            expect(mockedSubscriptionDelete).toHaveBeenCalled();
        });

        it('should call the `.delete` method on the client subscription when given a Subscription Instance', async () => {
            const subscription: Subscription = new Subscription(client, subscriptionName);
            await clientProxy.deleteSubscription(subscription).toPromise();
            expect(mockedSubscriptionDelete).toHaveBeenCalled();
        });
    });

    describe('getTopic', () => {
        it('should return a new Topic instance when supplied with a string', () => {
            const topic = clientProxy.getTopic(topicName);
            expect(topic).toBeInstanceOf(Topic);
        });

        it('should return the same Topic instance when supplied with a Topic instance', () => {
            const topic = new Topic(client, topicName);
            const newTopic = clientProxy.getTopic(topic);
            expect(topic).toBe(newTopic);
        });
    });

    describe('topicExists', () => {
        it('should call the `.exists` method on the client topic when given a string', async () => {
            await clientProxy.topicExists(topicName).toPromise();
            expect(mockedTopicExists).toHaveBeenCalled();
        });

        it('should call the `.exists` method on the client topic when given a Topic Instance', async () => {
            await clientProxy.topicExists(new Topic(client, topicName)).toPromise();
            expect(mockedTopicExists).toHaveBeenCalled();
        });
    });

    describe('createTopic', () => {
        it('should attempt to create a Topic when given a topic name', async () => {
            await clientProxy.createTopic(topicName).toPromise();
            expect(mockedTopicCreate).toHaveBeenCalled();
        });

        it('should attempt to create a Topic when given a topic instance', async () => {
            const topic = new Topic(client, topicName);
            await clientProxy.createTopic(topic).toPromise();
            expect(mockedTopicCreate).toHaveBeenCalled();
        });
    });

    describe('deleteTopic', () => {
        it('should call the `.delete` method on the client topic when given a string', async () => {
            await clientProxy.deleteTopic(topicName).toPromise();
            expect(mockedTopicDelete).toHaveBeenCalled();
        });

        it('should call the `.delete` method on the client topic when given a Topic Instance', async () => {
            await clientProxy.deleteTopic(new Topic(client, topicName)).toPromise();
            expect(mockedTopicDelete).toHaveBeenCalled();
        });
    });
});
