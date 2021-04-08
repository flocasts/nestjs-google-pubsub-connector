import { Message } from '@google-cloud/pubsub';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GooglePubSubContext } from '../ctx-host';

export const GooglePubSubMessageAck = createParamDecorator((data: unknown, ctx: ExecutionContext): (() => void) => {
    const pubSubCtx: GooglePubSubContext = ctx.switchToRpc().getContext();
    const message = pubSubCtx.getMessage();
    pubSubCtx.setAutoAck(false);
    return message.ack.bind(message);
});
