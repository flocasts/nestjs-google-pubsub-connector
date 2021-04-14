import { GooglePubSubContext } from '../ctx-host';
import { AckFunction, AckStrategy, NackFunction } from '../interfaces';

export class BasicAckStrategy implements AckStrategy {
    public ack(ack: AckFunction, nack: NackFunction, ctx: GooglePubSubContext): Promise<void> {
        if (ctx.getAutoAck()) {
            ack();
        }
        return Promise.resolve();
    }
}
