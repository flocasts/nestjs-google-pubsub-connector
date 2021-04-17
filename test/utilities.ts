import type { Message } from '@google-cloud/pubsub';
import { ExecutionContext } from '@nestjs/common';
import { GooglePubSubContext } from '../lib';

export const createMessage = (options?: Partial<Message>): Message =>
    (Object.assign(
        {
            ack: jest.fn(),
            nack: jest.fn(),
        },
        options,
    ) as unknown) as Message;

export const createExecutionContext = (ctx: GooglePubSubContext): ExecutionContext => {
    return {
        switchToRpc: () => {
            return {
                getContext: () => ctx,
            };
        },
    } as ExecutionContext;
};
