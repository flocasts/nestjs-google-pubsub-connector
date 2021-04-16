import type {
    PubSub,
    Subscription as SubscriptionType,
    Topic as TopicType,
} from '@google-cloud/pubsub';

const { Topic, Subscription } = jest.requireActual('@google-cloud/pubsub');
const moduleMock: any = jest.genMockFromModule('@google-cloud/pubsub');
const PubSubMock: jest.MockedClass<typeof PubSub> = moduleMock.PubSub;

Topic.prototype.createSubscription = jest
    .fn()
    .mockImplementation((name, options) =>
        Promise.resolve([new Subscription(new PubSubMock(), name, options)]),
    );

PubSubMock.prototype.subscription.mockImplementation(
    (name, options): SubscriptionType => new Subscription(new PubSubMock(), name, options),
);

PubSubMock.prototype.topic.mockImplementation((name, options) => {
    return new Topic(new PubSubMock(), name, options);
});

const subscriptionExistsMock = jest.fn().mockImplementation(() => {
    return Promise.resolve([true]);
});

Subscription.prototype.exists = subscriptionExistsMock;

const topicExistsMock = jest.fn().mockImplementation(() => {
    return Promise.resolve([true]);
});

Topic.prototype.exists = topicExistsMock;

module.exports = {
    PubSub: PubSubMock,
    Topic,
    Subscription,
};
