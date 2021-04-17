import { Message } from '@google-cloud/pubsub';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GooglePubSubContext } from '../ctx-host';

export const getMessageBody = (
    key: string | undefined,
    ctx: ExecutionContext,
): Record<string, any> | unknown => {
    const message: Message = ctx.switchToRpc().getContext<GooglePubSubContext>().getMessage();
    try {
        const body = JSON.parse(message.data.toString());
        if (key != null) {
            return body[key];
        }
        return body;
    } catch (error) {
        return null;
    }
};

export const GooglePubSubMessageBody = createParamDecorator<string | undefined>(getMessageBody);
