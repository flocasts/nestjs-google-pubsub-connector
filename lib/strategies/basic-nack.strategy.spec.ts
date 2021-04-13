import { GooglePubSubContext } from '../ctx-host';
import { GooglePubSubMessage } from '../interfaces';
import { BasicNackStrategy } from './basic-nack.strategy';

const message = {} as GooglePubSubMessage;
const pattern = JSON.stringify({ subscriptionName: 'bmw-7-series-facts' });
const error = new Error('he opened the trunk');

describe('Basic Nack Strategy', () => {
    const strategy = new BasicNackStrategy();

    const ackFn = jest.fn();
    const nackFn = jest.fn();

    it('should call nack if autoNack is enabled', () => {
        strategy.nack(
            error,
            ackFn,
            nackFn,
            new GooglePubSubContext([message, pattern, false, true]),
        );
        expect(nackFn).toHaveBeenCalled();
    });

    it('should not call nack if autoNack is not enabled', () => {
        strategy.nack(
            error,
            ackFn,
            nackFn,
            new GooglePubSubContext([message, pattern, false, false]),
        );
        expect(nackFn).not.toHaveBeenCalled();
    });
});
