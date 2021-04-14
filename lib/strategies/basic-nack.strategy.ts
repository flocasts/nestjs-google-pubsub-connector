import { GooglePubSubContext } from '../ctx-host';
import { AckFunction, NackFunction, NackStrategy } from '../interfaces';

export class BasicNackStrategy implements NackStrategy {
    public nack(
        error: unknown,
        ack: AckFunction,
        nack: NackFunction,
        ctx: GooglePubSubContext,
    ): Promise<void> {
        if (ctx.getAutoNack()) {
            nack();
        }
        return Promise.resolve();
    }
}
