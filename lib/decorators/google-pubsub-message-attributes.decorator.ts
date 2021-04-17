import { Message } from '@google-cloud/pubsub';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GooglePubSubMessageMessageAttributes = createParamDecorator<string | undefined>(
    (key, ctx: ExecutionContext) => {
        const message: Message = ctx.switchToRpc().getData().data;
        const attrs = message.attributes;
        if (key != null) {
            return attrs[key];
        }
        return attrs;
    },
);
