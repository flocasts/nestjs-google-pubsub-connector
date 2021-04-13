import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GooglePubSubContext } from '../ctx-host';

/**
 * Retrieves the nack function from the received message
 * and disables auto nack.
 */
export const GooglePubSubMessageNack = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): (() => void) => {
        const pubSubCtx: GooglePubSubContext = ctx.switchToRpc().getContext();
        const message = pubSubCtx.getMessage();
        pubSubCtx.setAutoNack(false);
        return message.nack.bind(message);
    },
);