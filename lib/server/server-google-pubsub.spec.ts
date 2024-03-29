/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PubSub, Subscription } from '@google-cloud/pubsub';
import { of } from 'rxjs';
import { ClientGooglePubSub } from '../client';
import { InvalidPatternMetadataException } from '../errors/invalid-pattern-metadata.exception';
import { GooglePubSubTransport } from './server-google-pubsub';

jest.mock('../client/client-google-pubsub.ts');
jest.mock('@google-cloud/pubsub');

describe('Google PubSub Server', () => {
    let server: GooglePubSubTransport;
    let clientProxy: ClientGooglePubSub;
    let subscriptionExistsMock: jest.MockedFunction<ClientGooglePubSub['subscriptionExists']>;
    let topicExistsMock: jest.MockedFunction<ClientGooglePubSub['topicExists']>;
    let createSubscriptionMock: jest.MockedFunction<ClientGooglePubSub['createSubscription']>;
    let getSubscriptionMock: jest.MockedFunction<ClientGooglePubSub['getSubscription']>;

    beforeEach(() => {
        clientProxy = new ClientGooglePubSub();
        server = new GooglePubSubTransport({
            client: clientProxy,
        });
        subscriptionExistsMock = clientProxy.subscriptionExists as jest.MockedFunction<
            ClientGooglePubSub['subscriptionExists']
        >;
        topicExistsMock = clientProxy.topicExists as jest.MockedFunction<
            ClientGooglePubSub['topicExists']
        >;
        createSubscriptionMock = clientProxy.createSubscription as jest.MockedFunction<
            ClientGooglePubSub['createSubscription']
        >;
        getSubscriptionMock = clientProxy.getSubscription as jest.MockedFunction<
            ClientGooglePubSub['getSubscription']
        >;

        subscriptionExistsMock.mockImplementation(() => of(true));
        topicExistsMock.mockImplementation(() => of(true));
        createSubscriptionMock.mockImplementation(
            (subscription: string | Subscription | undefined) =>
                of(new Subscription(new PubSub(), subscription as string)),
        );
        getSubscriptionMock.mockImplementation(
            (subscription: string | Subscription | undefined) =>
                new Subscription(new PubSub(), subscription as string),
        );
    });

    describe('getSubscriptionFromPattern', () => {
        let getSubscriptionFromPattern: (pattern: string) => Promise<void>;

        beforeEach(() => {
            // @ts-expect-error
            getSubscriptionFromPattern = server.getSubscriptionFromPattern.bind(server);
        });
        it('should get a subscription from a pattern', async () => {
            const pattern = JSON.stringify({ subscriptionName: 'my-sub-name' });
            await getSubscriptionFromPattern(pattern);

            expect(subscriptionExistsMock).toHaveBeenCalled();
            // @ts-expect-error
            expect(server.subscriptions.keys()).toContain(pattern);
        });

        it('should throw an InvalidPatternMetadata exception when given invalid JSON', async () => {
            expect(() => {
                return getSubscriptionFromPattern("[ this sure ain't JSON }");
            }).rejects.toBeInstanceOf(InvalidPatternMetadataException);
        });

        it('should throw an InvalidPatternMetadata exception when object does not contain a topic or subscription name', async () => {
            expect(() => {
                return getSubscriptionFromPattern(JSON.stringify({}));
            }).rejects.toBeInstanceOf(InvalidPatternMetadataException);
        });

        it("should get a subscription from a pattern and attempt to create if it doesn't exist", async () => {
            // @ts-expect-error
            server.createSubscriptions = true;
            const pattern = JSON.stringify({
                subscriptionName: 'my-sub-name',
                topicName: 'my-topic-name',
            });
            subscriptionExistsMock.mockImplementationOnce(() => of(false));
            await getSubscriptionFromPattern(pattern);

            expect(subscriptionExistsMock).toHaveBeenCalled();
            expect(createSubscriptionMock).toHaveBeenCalled();
            // @ts-expect-error
            expect(server.subscriptions.keys()).toContain(pattern);
        });

        it('should get a subscription from a pattern and not attempt to create if createSubscription is set to false', async () => {
            // @ts-expect-error
            server.createSubscriptions = false;
            const pattern = JSON.stringify({
                subscriptionName: 'my-sub-name',
                topicName: 'my-topic-name',
            });
            subscriptionExistsMock.mockImplementationOnce(() => of(true));
            await getSubscriptionFromPattern(pattern);

            expect(subscriptionExistsMock).toHaveBeenCalled();
            expect(createSubscriptionMock).not.toHaveBeenCalled();
            // @ts-expect-error
            expect(server.subscriptions.keys()).toContain(pattern);
        });

        it('should put the subscription in synchronous subscriptions', async () => {
            //@ts-expect-error
            server.createSubscriptions = true;
            const pattern = JSON.stringify({
                subscriptionName: 'my-sync-sub',
                topicName: 'my-topic-name',
                oneAtATime: true,
            });
            subscriptionExistsMock.mockImplementationOnce(() => of(false));
            await getSubscriptionFromPattern(pattern);

            expect(subscriptionExistsMock).toHaveBeenCalled();
            expect(createSubscriptionMock).toHaveBeenCalled();
            //@ts-expect-error
            expect(server.synchronousSubscriptions.keys()).toContain(pattern);
        });
    });
});
