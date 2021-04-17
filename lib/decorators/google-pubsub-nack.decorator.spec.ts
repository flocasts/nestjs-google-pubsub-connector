import { createExecutionContext, createMessage } from '../../test/utilities';
import { GooglePubSubContext } from '../ctx-host';
import { getNackFn } from './google-pubsub-nack.decorator';

const nackMock = jest.fn();
const message = createMessage({ nack: nackMock });

describe('Nack Decorator', () => {
    let ctx: GooglePubSubContext;

    beforeEach(() => {
        ctx = new GooglePubSubContext([message, '', true, true]);
    });

    it('should get the nack fn from the context object and set `autoNack` to false on the ctx', () => {
        const nack = getNackFn({}, createExecutionContext(ctx));
        nack();
        expect(nackMock).toHaveBeenCalled();
        expect(ctx.getAutoNack()).toBe(false);
    });
});
