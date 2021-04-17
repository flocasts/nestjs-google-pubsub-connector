import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GooglePubSubContext } from '../ctx-host';

export const getAckFn = (data: unknown, ctx: ExecutionContext): (() => void) => {
    const pubSubCtx: GooglePubSubContext = ctx.switchToRpc().getContext<GooglePubSubContext>();
    return pubSubCtx.getAckFunction();
};

/**
 * Retrieves the ack function from the received message
 * and disables auto ack.
 */
export const GooglePubSubMessageAck = createParamDecorator(getAckFn);
