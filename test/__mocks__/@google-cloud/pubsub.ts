// import { Topic, Subscription, PubSub } from '@google-cloud/pubsub'

const pubSubMock: any = jest.genMockFromModule('@google-cloud/pubsub');
const { Topic, Subscription } = jest.requireActual('@google-cloud/pubsub');
module.exports = {
    PubSub: pubSubMock.PubSub,
    Topic,
    Subscription,
};
