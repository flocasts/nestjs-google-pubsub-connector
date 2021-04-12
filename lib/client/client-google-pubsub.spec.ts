jest.mock('@google-cloud/pubsub');
import { PubSub, Subscription, Topic } from '@google-cloud/pubsub';
import { GooglePubSubTopic } from '../interfaces';
import { ClientGooglePubSub } from './client-google-pubsub';

const topicName = 'project-venison-plans';
const subscriptionName = 'project-v-tem-ray-notifier';
const testMessage = "We're at Side 7";
const testBuffer = Buffer.from(testMessage);

describe('ClientGooglePubSub', () => {
    const client: PubSub = new PubSub();
    const clientProxy: ClientGooglePubSub = new ClientGooglePubSub({ pubSubClient: client });

    // Mock implementations
    const subscriptionFactory: PubSub['subscription'] = (name: string, options: any) => {
        return new Subscription(client, name);
    };
    const topicFactory: PubSub['topic'] = (name: string, options: any) => {
        return new Topic(client, name);
    };

    const mockedPublish: jest.MockedFunction<GooglePubSubTopic['publish']> = jest.fn();
    const mockedClose: jest.MockedFunction<PubSub['close']> = client.close as any;
    const mockedTopicFunction: jest.MockedFunction<
        PubSub['topic']
    > = (client.topic as any).mockImplementation(topicFactory);
    const mockedSubscriptionFunction: jest.MockedFunction<
        PubSub['subscription']
    > = (client.subscription as any).mockImplementation(subscriptionFactory);

    describe('close', () => {
        it('should call the close method on the PubSub client', async () => {
            mockedClose.mockImplementationOnce(() => Promise.resolve());
            await clientProxy.close().toPromise();
            expect(client.close).toHaveBeenCalled();
        });
    });

    describe('publishToTopic', () => {
        it('should attempt to publish a Buffer to the provided topic', async () => {
            mockedPublish.mockImplementation(() => Promise.resolve());
            mockedTopicFunction.mockImplementationOnce(() => {
                return ({ publish: mockedPublish } as unknown) as GooglePubSubTopic;
            });
            await clientProxy.publishToTopic(topicName, testBuffer).toPromise();
            expect(client.topic).toHaveBeenLastCalledWith(topicName);
            expect(mockedPublish).toHaveBeenLastCalledWith(testBuffer);
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
        const mockedExists: jest.Mock<Subscription['exists']> = jest
            .fn()
            .mockImplementation(() => Promise.resolve([]));

        beforeEach(() => {
            mockedSubscriptionFunction.mockImplementationOnce(() => {
                return ({
                    exists: mockedExists,
                } as unknown) as Subscription;
            });
        });

        it('should call the `.exists` method on the client subscription when given a string', async () => {
            await clientProxy.subscriptionExists(subscriptionName).toPromise();
            expect(mockedExists).toHaveBeenCalled();
        });

        it('should call the `.exists` method on the client subscription when given a Subscription Instance', async () => {
            const subscription: Subscription = {
                exists: mockedExists,
            } as any;
            await clientProxy.subscriptionExists(subscription).toPromise();
            expect(mockedExists).toHaveBeenCalled();
        });
    });

    describe('createSubscription', () => {
        let mockedCreateSubscription: jest.SpyInstance;

        beforeEach(() => {
            const topic = new Topic(client, topicName);
            mockedCreateSubscription = jest
                .spyOn(topic, 'createSubscription')
                .mockImplementation(() => Promise.resolve([]));
            mockedTopicFunction.mockImplementationOnce(() => topic);
        });

        it('should attempt to create a Subscription when given a subscription name and a topic name', async () => {
            await clientProxy.createSubscription(subscriptionName, topicName).toPromise();
            expect(mockedCreateSubscription).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance and a topic name', async () => {
            const subscription = new Subscription(client, subscriptionName);
            await clientProxy.createSubscription(subscription, topicName).toPromise();
            expect(mockedCreateSubscription).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance with a topic name set', async () => {
            const subscription = new Subscription(client, subscriptionName);
            subscription.topic = topicName;
            await clientProxy.createSubscription(subscription).toPromise();
            expect(mockedCreateSubscription).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance and a topic instance', async () => {
            const subscription = new Subscription(client, subscriptionName);
            subscription.topic = topicName;
            await clientProxy.createSubscription(subscription).toPromise();
            expect(mockedCreateSubscription).toHaveBeenCalled();
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
        const mockedExists: jest.Mock<Topic['exists']> = jest
            .fn()
            .mockImplementation(() => Promise.resolve([]));

        beforeEach(() => {
            mockedTopicFunction.mockImplementationOnce(() => {
                return ({
                    exists: mockedExists,
                } as unknown) as Topic;
            });
        });

        it('should call the `.exists` method on the client topic when given a string', async () => {
            await clientProxy.topicExists(topicName).toPromise();
            expect(mockedExists).toHaveBeenCalled();
        });

        it('should call the `.exists` method on the client topic when given a Topic Instance', async () => {
            const topic: Topic = {
                exists: mockedExists,
            } as any;
            await clientProxy.topicExists(topic).toPromise();
            expect(mockedExists).toHaveBeenCalled();
        });
    });
});
