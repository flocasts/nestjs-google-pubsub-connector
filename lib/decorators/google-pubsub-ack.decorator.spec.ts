import { createExecutionContext, createMessage } from '../../test/utilities';
import { GooglePubSubContext } from '../ctx-host';
import { getAckFn } from './google-pubsub-ack.decorator';

const ackMock = jest.fn();
const message = createMessage({ ack: ackMock });

describe('Ack Decorator', () => {
    let ctx: GooglePubSubContext;

    beforeEach(() => {
        ctx = new GooglePubSubContext([message, '', true, true]);
    });

    it('should get the ack fn from the context object and set `autoAck` to false on the ctx', () => {
        const ack = getAckFn({}, createExecutionContext(ctx));
        ack();
        expect(ackMock).toHaveBeenCalled();
        expect(ctx.getAutoAck()).toBe(false);
    });
});
