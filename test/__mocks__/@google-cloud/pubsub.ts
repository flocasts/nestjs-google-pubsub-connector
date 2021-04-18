import type {
    PubSub,
    Subscription as SubscriptionType,
    Topic as TopicType,
} from '@google-cloud/pubsub';

const { Topic, Subscription } = jest.requireActual('@google-cloud/pubsub');
const moduleMock: any = jest.genMockFromModule('@google-cloud/pubsub');
const PubSubMock: jest.MockedClass<typeof PubSub> = moduleMock.PubSub;

PubSubMock.prototype.subscription.mockImplementation(
    (name, options): SubscriptionType => new Subscription(new PubSubMock(), name, options),
);

PubSubMock.prototype.topic.mockImplementation((name, options) => {
    return new Topic(new PubSubMock(), name, options);
});

PubSubMock.prototype.close.mockImplementation(() => {
    return Promise.resolve();
});

const subscriptionExistsMock = jest.fn().mockImplementation(() => {
    return Promise.resolve([true]);
});

Subscription.prototype.exists = subscriptionExistsMock;

const subscriptionDeleteMock = jest.fn().mockImplementation(() => {
    return Promise.resolve([true]);
});

Subscription.prototype.delete = subscriptionDeleteMock;

const subscriptionCreateMock = jest
    .fn()
    .mockImplementation((name, options) =>
        Promise.resolve([new Subscription(new PubSubMock(), name, options)]),
    );
Topic.prototype.createSubscription = subscriptionCreateMock;

const topicCreateMock = jest
    .fn()
    .mockImplementation(() => Promise.resolve([new Topic(new PubSubMock(), 'mock-topic')]));
Topic.prototype.create = topicCreateMock;

const topicExistsMock = jest.fn().mockImplementation(() => {
    return Promise.resolve([true]);
});

Topic.prototype.exists = topicExistsMock;

const topicDeleteMock = jest.fn().mockImplementation(() => {
    return Promise.resolve([true]);
});

Topic.prototype.delete = topicDeleteMock;

const topicPublishMock = jest.fn().mockImplementation(() => {
    return Promise.resolve([true]);
});

Topic.prototype.publish = topicPublishMock;

module.exports = {
    PubSub: PubSubMock,
    Topic,
    Subscription,
};
