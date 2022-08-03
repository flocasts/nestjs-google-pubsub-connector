import { Message } from '@google-cloud/pubsub';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GooglePubSubContext } from '../ctx-host';

export const getDeliveryAttempts = (key: string | undefined, ctx: ExecutionContext): number => {
    const message: Message = ctx.switchToRpc().getContext<GooglePubSubContext>().getMessage();
    return message.deliveryAttempt;
};

export const GooglePubSubMessageDeliveryAttempts = createParamDecorator<string | undefined>(
    getDeliveryAttempts,
);
