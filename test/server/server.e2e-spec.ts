/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PubSub, Subscription } from '@google-cloud/pubsub';
import { INestMicroservice } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { throwError } from 'rxjs';
import { ExampleController } from '../../examples/server/example.controller';
import { ExampleService } from '../../examples/server/example.service';
import { ClientGooglePubSub, GooglePubSubSubscription, GooglePubSubTransport } from '../../lib';
import { createMessage } from '../utilities';

jest.mock('../../examples/server/example.service');

const subscriptionCreationOptions = {
    enableMessageOrdering: true,
    retainAckedMessages: false,
};

const expendablesHandlerPattern = {
    subscriptionName: 'lee-christmas-notifications',
    createOptions: subscriptionCreationOptions,
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

const sleep = () => new Promise((res) => setTimeout(res, 5));

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

        it('should be able to get handlers for all subscriptions', () => {
            for (const [pattern] of subscriptions) {
                expect(strategy.getHandlerByPattern(pattern)).not.toBeNull();
            }
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
            const message = createMessage({
                data: data,
                attributes: { contractId: 'rescue-zhou' },
            });
            subscription.emit('message', message);

            await sleep();
            expect(doStuffMock).toHaveBeenCalledWith(
                { expendable: true },
                { contractId: 'rescue-zhou' },
            );
        });

        it('should call `doStuffAsync` example service with expected parameters', async () => {
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(theTransporterHandlerPattern),
            )!;
            const data = Buffer.from(JSON.stringify({ trunkClosed: false }));
            const message = createMessage({
                data: data,
                attributes: { licenseNum: 'abc12345' },
            });
            subscription.emit('message', message);

            await sleep();
            expect(doStuffMockAsync).toHaveBeenCalledWith(false, 'abc12345');
        });

        it('should call `doStuffObservable` example service with expected parameters', async () => {
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(crankHandlerPattern),
            )!;
            const data = Buffer.from(JSON.stringify({ heartRate: 180 }));
            const message = createMessage({ data: data });
            subscription.emit('message', message);

            await sleep();
            expect(doStuffMockObservable).toHaveBeenCalledWith(180);
        });
    });

    describe('Ack/Nack', () => {
        it('should call call the ack function when the handler is run successfully', async () => {
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(expendablesHandlerPattern),
            )!;

            const data = Buffer.from('{}');
            const ackMock = jest.fn();
            const message = createMessage({
                data: data,
                ack: ackMock,
            });
            subscription.emit('message', message);

            await sleep();
            expect(ackMock).toHaveBeenCalledWith();
        });

        it('should call call the nack function when the handler encounters an error', async () => {
            //@ts-expect-error
            strategy.autoNack = true;
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(expendablesHandlerPattern),
            )!;

            doStuffMock.mockImplementationOnce(() => {
                throw ':-(';
            });

            const data = Buffer.from('{}');
            const nackMock = jest.fn();
            const message = createMessage({
                data: data,
                nack: nackMock,
            });
            subscription.emit('message', message);

            await sleep();
            expect(nackMock).toHaveBeenCalledWith();
        });

        it('should call call the nack function when the handler rejects', async () => {
            //@ts-expect-error
            strategy.autoNack = true;
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(theTransporterHandlerPattern),
            )!;

            doStuffMockAsync.mockRejectedValueOnce('Promise<:-(>');

            const data = Buffer.from('{}');
            const nackMock = jest.fn();
            const message = createMessage({
                data: data,
                nack: nackMock,
            });
            subscription.emit('message', message);

            await sleep();
            expect(nackMock).toHaveBeenCalledWith();
        });

        it('should call call the nack function when the handler returns a `throwError` operator', async () => {
            //@ts-expect-error
            strategy.autoNack = true;
            const subscription: Subscription = subscriptions.get(
                JSON.stringify(crankHandlerPattern),
            )!;

            doStuffMockObservable.mockReturnValueOnce(throwError('Observable<:-(>'));

            const data = Buffer.from('{}');
            const nackMock = jest.fn();
            const message = createMessage({
                data: data,
                nack: nackMock,
            });
            subscription.emit('message', message);

            await sleep();
            expect(nackMock).toHaveBeenCalledWith();
        });
    });
});
