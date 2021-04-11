import { GooglePubSubContext } from '../ctx-host';
import { NackStrategy } from '../interfaces';

export class BasicNackStrategy implements NackStrategy {
    public nack(
        error: Error,
        ack: () => void,
        nack: () => void,
        ctx: GooglePubSubContext,
    ): Promise<void> {
        if (ctx.getAutoNack()) {
            nack();
        }
        return Promise.resolve();
    }
}
