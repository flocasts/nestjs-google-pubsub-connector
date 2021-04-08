import { Message } from '@google-cloud/pubsub';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GooglePubSubMessageBody = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): Record<string, any> => {
        const message: Message = ctx.switchToRpc().getData();
        return message;
    },
);
