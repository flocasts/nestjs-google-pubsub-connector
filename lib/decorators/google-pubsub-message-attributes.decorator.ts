import { Message } from '@google-cloud/pubsub';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GooglePubSubContext } from '../ctx-host';

export const getMessageAttrs = (
    key: string | undefined,
    ctx: ExecutionContext,
): (string | undefined) | Record<string, string> => {
    const message: Message = ctx.switchToRpc().getContext<GooglePubSubContext>().getMessage();
    const attrs = message.attributes;
    if (attrs != null && key != null) {
        return attrs[key];
    }
    return attrs;
};

export const GooglePubSubMessageMessageAttributes = createParamDecorator<string | undefined>(
    getMessageAttrs,
);
