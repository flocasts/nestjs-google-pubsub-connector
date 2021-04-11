import {
    ClientConfig as GooglePubSubClientConfig,
    CreateSubscriptionOptions,
    ExistsResponse,
    PubSub,
    Subscription,
    Topic,
} from '@google-cloud/pubsub';
import { GooglePubSubTopic } from '../interfaces';
import { ClientGooglePubSub } from './client-google-pubsub';

jest.mock('@google-cloud/pubsub');

const topicName = 'project-venison-plans';
const testMessage = "We're at Side 7";

describe('ClientGooglePubSub', () => {
    let client: PubSub;
    let clientProxy: ClientGooglePubSub;

    beforeEach(() => {
        client = new PubSub();
        clientProxy = new ClientGooglePubSub({ pubSubClient: client });
    });

    describe('close', () => {
        it('should call the close method on the PubSub client', async () => {
            const mockedClose = client.close as jest.MockedFunction<PubSub['close']>;
            mockedClose.mockImplementationOnce(() => Promise.resolve());
            await clientProxy.close().toPromise();
            expect(client.close).toHaveBeenCalled();
        });
    });

    describe('publishToTopic', () => {
        it('should attempt to publish a Buffer to the provided topic', async () => {
            const mockedTopicFunction = client.topic as jest.MockedFunction<PubSub['topic']>;
            const mockedPublish: jest.MockedFunction<GooglePubSubTopic['publish']> = jest.fn();
            mockedPublish.mockReturnValueOnce();
            mockedTopicFunction.mockImplementationOnce(() => {
                return ({ publish: mockedPublish } as unknown) as GooglePubSubTopic;
            });
            await clientProxy.publishToTopic(topicName, Buffer.from(testMessage)).toPromise();
            expect(client.topic).toHaveBeenLastCalledWith(topicName);
        });
    });
});
