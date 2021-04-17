import { createExecutionContext, createMessage } from '../../test/utilities';
import { GooglePubSubContext } from '../ctx-host';
import { getMessageBody } from './google-pubsub-message-body.decorator';

const data = {
    jobType: 'italian',
    cooperType: 'mini',
};
const message = createMessage({ data: Buffer.from(JSON.stringify(data)) });

describe('Message Body Decorator', () => {
    let ctx: GooglePubSubContext;

    beforeEach(() => {
        ctx = new GooglePubSubContext([message, '', true, true]);
    });

    it('should get the message body from the message', () => {
        const msgData = getMessageBody(undefined, createExecutionContext(ctx));
        expect(msgData).toEqual(data);
    });

    it('should get the a property of the body from the message when a key is provided', () => {
        const prop = getMessageBody('jobType', createExecutionContext(ctx));
        expect(prop).toEqual(data.jobType);
    });

    it('should get the a property of the body from the message when a key is provided', () => {
        const badMessage = createMessage({ data: Buffer.from('{not JSON]') });
        ctx = new GooglePubSubContext([badMessage, '', true, true]);
        const prop = getMessageBody('jobType', createExecutionContext(ctx));
        expect(prop).toBeNull();
    });
});
