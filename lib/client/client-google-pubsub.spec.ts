jest.mock('@google-cloud/pubsub');
import { CreateSubscriptionOptions, PubSub, Subscription, Topic } from '@google-cloud/pubsub';
import { ClientGooglePubSub } from './client-google-pubsub';
import { GOOGLE_PUBSUB_SUBSCRIPTION_MESSAGE_EVENT } from '../constants';

const topicName = 'project-venison-plans';
const subscriptionName = 'project-v-tem-ray-notifier';
const subscriptionCreationOption = {
    enableMessageOrdering: true,
    retainAckedMessages: false,
    expirationPolicy: {
        ttl: {
            seconds: 30,
        },
    },
    retryPolicy: {
        minimumBackoff: {
            seconds: 10,
        },
        maximumBackoff: {
            seconds: 600,
        },
    },
} as CreateSubscriptionOptions;
const testMessage = "We're at Side 7";
const testBuffer = Buffer.from(testMessage);

const client: PubSub = new PubSub();
const clientProxy: ClientGooglePubSub = new ClientGooglePubSub({ pubSubClient: client });

const mockedClose = PubSub.prototype.close as jest.MockedFunction<PubSub['close']>;
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
    // Provide default mock implementations so RxJS `from(...)` receives Promises, not undefined
    beforeAll(() => {
        (PubSub.prototype.close as unknown as jest.Mock).mockResolvedValue(undefined);
        (Subscription.prototype.exists as unknown as jest.Mock).mockResolvedValue([true]);
        (Subscription.prototype.delete as unknown as jest.Mock).mockResolvedValue(undefined);
        (Topic.prototype.exists as unknown as jest.Mock).mockResolvedValue([true]);
        (Topic.prototype.create as unknown as jest.Mock).mockResolvedValue([
            new Topic(client, topicName),
        ]);
        (Topic.prototype.delete as unknown as jest.Mock).mockResolvedValue(undefined);
        (Topic.prototype.createSubscription as unknown as jest.Mock).mockResolvedValue([
            new Subscription(client, subscriptionName),
        ]);
        // By default, have client.topic(name) return a Topic instance
        (client.topic as unknown as jest.Mock).mockImplementation(
            (name: string) => new Topic(client, name),
        );
    });

    describe('close', () => {
        it('should call the close method on the PubSub client', async () => {
            await clientProxy.close().toPromise();
            expect(mockedClose).toHaveBeenCalled();
        });
    });

    describe('publishToTopic', () => {
        // Build a Topic-like mock with the methods our code under test uses
        const mockTopic = {
            publishMessage: jest.fn().mockResolvedValue('msg-id-123'),
            create: jest.fn(),
            exists: jest.fn(),
            delete: jest.fn(),
            createSubscription: jest.fn(),
        };

        beforeEach(() => {
            jest.clearAllMocks();
            (client.topic as unknown as jest.Mock).mockReturnValue(mockTopic);
        });

        afterEach(() => {
            // Restore default behavior for other test suites
            (client.topic as unknown as jest.Mock).mockImplementation(
                (name: string) => new Topic(client, name),
            );
        });

        it('should attempt to publish a Buffer to the provided topic', async () => {
            await clientProxy.publishToTopic(topicName, testBuffer).toPromise();
            expect(client.topic).toHaveBeenLastCalledWith(topicName);
            expect(mockTopic.publishMessage).toHaveBeenLastCalledWith({
                data: testBuffer,
                attributes: undefined,
            });
        });

        it('should attempt to publish an object to the provided topic', async () => {
            const data = { songTitle: "Comin' on" };
            await clientProxy.publishToTopic(topicName, data).toPromise();
            expect(client.topic).toHaveBeenLastCalledWith(topicName);
            expect(mockTopic.publishMessage).toHaveBeenLastCalledWith({
                json: data,
                attributes: undefined,
            });
        });

        it('should attempt to publish an object to the provided topic with message attributes', async () => {
            const data = { songTitle: "Comin' on" };
            const attrs = { bandName: 'The Shamen' };
            await clientProxy.publishToTopic(topicName, data, attrs).toPromise();
            expect(client.topic).toHaveBeenLastCalledWith(topicName);
            expect(mockTopic.publishMessage).toHaveBeenLastCalledWith({
                json: data,
                attributes: attrs,
            });
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

        it('should attempt to create a Subscription when given a subscription name and a topic name and a creation options', async () => {
            await clientProxy
                .createSubscription(subscriptionName, topicName, subscriptionCreationOption)
                .toPromise();
            expect(mockedSubscriptionCreate).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance and a topic name', async () => {
            const subscription = new Subscription(client, subscriptionName);
            await clientProxy.createSubscription(subscription, topicName).toPromise();
            expect(mockedSubscriptionCreate).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance and a topic name and a creation options', async () => {
            const subscription = new Subscription(client, subscriptionName);
            await clientProxy
                .createSubscription(subscription, topicName, subscriptionCreationOption)
                .toPromise();
            expect(mockedSubscriptionCreate).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance with a topic name set', async () => {
            const subscription = new Subscription(client, subscriptionName);
            subscription.topic = topicName;
            await clientProxy.createSubscription(subscription).toPromise();
            expect(mockedSubscriptionCreate).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance with a topic name set and a creation options', async () => {
            const subscription = new Subscription(client, subscriptionName);
            subscription.topic = topicName;
            await clientProxy
                .createSubscription(subscription, undefined, subscriptionCreationOption)
                .toPromise();
            expect(mockedSubscriptionCreate).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance and a topic instance', async () => {
            const subscription = new Subscription(client, subscriptionName);
            subscription.topic = topicName;
            await clientProxy.createSubscription(subscription).toPromise();
            expect(mockedSubscriptionCreate).toHaveBeenCalled();
        });

        it('should attempt to create a Subscription when given a subscription instance and a topic instance and a creation options', async () => {
            const subscription = new Subscription(client, subscriptionName);
            subscription.topic = topicName;
            await clientProxy
                .createSubscription(subscription, undefined, subscriptionCreationOption)
                .toPromise();
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

    describe('getMessageIterator', () => {
        it('should return an AsyncGenerator object', async () => {
            const messageIterator = clientProxy.getMessageIterator(subscriptionName);
            expect(messageIterator).toHaveProperty('next');
            expect(messageIterator).toHaveProperty('return');
        });

        it('should return a new message only when "next" is called', async () => {
            const mockSub = new Subscription(client, subscriptionName);
            jest.spyOn(clientProxy, 'getSubscription').mockReturnValue(mockSub);
            process.nextTick(() => {
                mockSub.emit(GOOGLE_PUBSUB_SUBSCRIPTION_MESSAGE_EVENT, 'hello');
                mockSub.emit(
                    GOOGLE_PUBSUB_SUBSCRIPTION_MESSAGE_EVENT,
                    'hello 2: electric boogaloo',
                );
            });
            const messageIterator = clientProxy.getMessageIterator(subscriptionName);
            const messages = [];
            messages.push(await messageIterator.next());
            expect(messages.length).toEqual(1);
            expect(messages[0]?.value).toEqual(['hello']);
            messages.push(await messageIterator.next());
            expect(messages.length).toEqual(2);
            expect(messages[1]?.value).toEqual(['hello 2: electric boogaloo']);
        });
    });
});
