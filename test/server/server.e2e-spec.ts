/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Message, PubSub, Subscription } from '@google-cloud/pubsub';
import { INestMicroservice } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExampleController } from '../../examples/server/example.controller';
import { ExampleService } from '../../examples/server/example.service';
import { ClientGooglePubSub, GooglePubSubSubscription, GooglePubSubTransport } from '../../lib';

jest.mock('../../examples/server/example.service');

const expendablesHandlerPattern = {
    subscriptionName: 'lee-christmas-notifications',
    topicName: 'expendables-headquarters',
};

const theTransporterHandlerPattern = {
    subscriptionName: 'transport-jobs',
};

const crankHandlerPattern = {
    topicName: 'health-stats',
};

const MockExampleService = ExampleService as jest.MockedClass<typeof ExampleService>;
const doStuffMock = MockExampleService.prototype.doStuff;
const doStuffMockAsync = MockExampleService.prototype.doStuffAsync;
const doStuffMockObservable = MockExampleService.prototype.doStuffObservable;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const createMessage = (options: Partial<Message>): Message =>
    (Object.assign(
        {
            ack: jest.fn(),
            nack: jest.fn(),
        },
        options,
    ) as unknown) as Message;

describe('Server E2E Tests', () => {
    let pubsub: PubSub;
    let client: ClientGooglePubSub;
    let strategy: GooglePubSubTransport;
    let subscriptions: Map<string, GooglePubSubSubscription>;
    let app: INestMicroservice;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ExampleService],
            controllers: [ExampleController],
        }).compile();

        pubsub = new PubSub();
        client = new ClientGooglePubSub({ pubSubClient: pubsub });
        strategy = new GooglePubSubTransport({
            createSubscriptions: true,
            client: client,
        });

        //@ts-expect-error
        subscriptions = strategy.subscriptions;

        app = module.createNestMicroservice({ strategy: strategy });
        await app.listenAsync();
    });

    describe('Subscription Initialization', () => {
        it('it should initialize a subscription for each handler', () => {
            expect(subscriptions.size).toBe(3);
        });

        it('it should initialize a subscription when a topic name and subscription name are provided', () => {
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(expendablesHandlerPattern),
            )!;

            expect(subscription).toBeDefined();
            expect(subscription.name).toMatch(
                new RegExp(`${expendablesHandlerPattern.subscriptionName}`),
            );
        });

        it('it should initialize a subscription when only a subscription name is provided', () => {
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(theTransporterHandlerPattern),
            )!;

            expect(subscription).toBeDefined();
            expect(subscription.name).toMatch(
                new RegExp(`${theTransporterHandlerPattern.subscriptionName}`),
            );
        });

        it('it should attempt to create a subscription when only a topic name is provided', () => {
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(crankHandlerPattern),
            )!;

            expect(subscription).toBeDefined();
            expect(subscription.name).toMatch(new RegExp(`${crankHandlerPattern.topicName}-sub`));
        });
    });

    describe('Message Handling', () => {
        it('should call `doStuff` example service with expected parameters', async () => {
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(expendablesHandlerPattern),
            )!;

            const data = Buffer.from(JSON.stringify({ expendable: true }));
            const message = createMessage({ data: data });
            subscription.emit('message', message);

            await sleep(10);
            expect(doStuffMock).toHaveBeenCalledWith({ expendable: true });
        });

        it('should call `doStuffAsync` example service with expected parameters', async () => {
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(theTransporterHandlerPattern),
            )!;
            const data = Buffer.from(JSON.stringify({ trunkClosed: false }));
            const message = createMessage({ data: data });
            subscription.emit('message', message);

            await sleep(10);
            expect(doStuffMockAsync).toHaveBeenCalledWith(false);
        });

        it('should call `doStuffObservable` example service with expected parameters', async () => {
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(crankHandlerPattern),
            )!;
            const data = Buffer.from(JSON.stringify({ heartRate: 180 }));
            const message = createMessage({ data: data });
            subscription.emit('message', message);

            await sleep(10);
            expect(doStuffMockObservable).toHaveBeenCalledWith(180);
        });
    });
});
