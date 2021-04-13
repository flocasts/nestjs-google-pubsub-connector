import { BasicSubscriptionNamingStrategy } from './basic-subscription-name-strategy';

describe('Basic Naming Strategy', () => {
    const strategy = new BasicSubscriptionNamingStrategy();
    it('should concatenate topic name and subscription name', () => {
        const topicName = 'expendables-1';
        const subscriptionName = 'totally-rocks';
        const name = strategy.generateSubscriptionName(topicName, subscriptionName);

        expect(name).toEqual(`${topicName}-${subscriptionName}`);
    });
});
