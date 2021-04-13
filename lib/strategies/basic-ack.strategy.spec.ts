import { GooglePubSubContext } from '../ctx-host';
import { GooglePubSubMessage } from '../interfaces';
import { BasicAckStrategy } from './basic-ack.strategy';

const message = {} as GooglePubSubMessage;
const pattern = JSON.stringify({ subscriptionName: 'bmw-7-series-facts' });

describe('Basic Ack Strategy', () => {
    const strategy = new BasicAckStrategy();

    const ackFn = jest.fn();
    const nackFn = jest.fn();

    it('should call ack if autoAck is enabled', () => {
        strategy.ack(ackFn, nackFn, new GooglePubSubContext([message, pattern, true, false]));
        expect(ackFn).toHaveBeenCalled();
    });

    it('should not call ack if autoAck is not enabled', () => {
        strategy.ack(ackFn, nackFn, new GooglePubSubContext([message, pattern, false, false]));
        expect(ackFn).not.toHaveBeenCalled();
    });
});
