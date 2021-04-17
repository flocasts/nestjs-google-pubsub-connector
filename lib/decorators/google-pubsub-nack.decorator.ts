import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GooglePubSubContext } from '../ctx-host';

export const getNackFn = (data: unknown, ctx: ExecutionContext): (() => void) => {
    const pubSubCtx: GooglePubSubContext = ctx.switchToRpc().getContext();
    return pubSubCtx.getNackFunction();
};

/**
 * Retrieves the nack function from the received message
 * and disables auto nack.
 */
export const GooglePubSubMessageNack = createParamDecorator(getNackFn);
