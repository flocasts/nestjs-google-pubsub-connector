import { createExecutionContext, createMessage } from '../../test/utilities';
import { GooglePubSubContext } from '../ctx-host';
import { getMessageAttrs } from './google-pubsub-message-attributes.decorator';

const attributes = {
    lockStock: 'true',
    two: '2',
};
const message = createMessage({ attributes });

describe('Message Attributes Decorator', () => {
    let ctx: GooglePubSubContext;

    beforeEach(() => {
        ctx = new GooglePubSubContext([message, '', true, true]);
    });

    it('should get the message attributes from the message', () => {
        const msgAttrs = getMessageAttrs(undefined, createExecutionContext(ctx));
        expect(msgAttrs).toEqual(attributes);
    });

    it('should get the a property of the attributes from the message when a key is provided', () => {
        const prop = getMessageAttrs('lockStock', createExecutionContext(ctx));
        expect(prop).toEqual(attributes.lockStock);
    });
});
