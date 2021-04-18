import type { PubSub, Subscription as SubscriptionType } from '@google-cloud/pubsub';

const { Topic, Subscription } = jest.requireActual('@google-cloud/pubsub');
const moduleMock: { PubSub: typeof PubSub } = jest.genMockFromModule('@google-cloud/pubsub');
const PubSubMock = moduleMock.PubSub as jest.MockedClass<typeof PubSub>;

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

const topicPublishJSONMock = jest.fn().mockImplementation(() => {
    return Promise.resolve([true]);
});
Topic.prototype.publishJSON = topicPublishJSONMock;

module.exports = {
    PubSub: PubSubMock,
    Topic,
    Subscription,
};
