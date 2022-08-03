import { Message } from '@google-cloud/pubsub';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GooglePubSubContext } from '../ctx-host';

export const getMessageId = (key: string | undefined, ctx: ExecutionContext): string => {
    const message: Message = ctx.switchToRpc().getContext<GooglePubSubContext>().getMessage();
    return message.id;
};

export const GooglePubSubMessageId = createParamDecorator<string | undefined>(getMessageId);
