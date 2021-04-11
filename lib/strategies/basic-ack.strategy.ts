import { GooglePubSubContext } from '../ctx-host';
import { AckStrategy } from '../interfaces';

export class BasicAckStrategy implements AckStrategy {
    public ack(ack: () => void, nack: () => void, ctx: GooglePubSubContext): Promise<void> {
        if (ctx.getAutoAck()) {
            ack();
        }
        return Promise.resolve();
    }
}
