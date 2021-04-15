import { Message } from '@google-cloud/pubsub';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GooglePubSubMessageBody = createParamDecorator<string | undefined>(
    (key, ctx: ExecutionContext) => {
        const message: Message = ctx.switchToRpc().getData().data;
        const body = JSON.parse(message.data.toString());
        if (key != null) {
            return body[key];
        }
        return body;
    },
);
