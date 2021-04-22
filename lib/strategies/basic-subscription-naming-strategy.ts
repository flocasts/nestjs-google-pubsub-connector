import { InvalidNamingStrategyArgsException } from '../errors/invalid-naming-strategy-args.exception';
import { SubscriptionNamingStrategy } from '../interfaces';

/**
 * The default strategy for naming subscriptions
 *
 * @remarks
 * When used, this will return either a computed subscription name, based off the topic, or
 * if a subscription name is supplied will return that same subscription name.
 *
 * @example
 * const namingStrategy = new BasicSubscriptionNamingStrategy()
 * const nameOne = namingStrategy.generateSubscriptionName('my-topic') // returns 'my-topic-sub'
 * const nameOne = namingStrategy.generateSubscriptionName('my-topic', 'my-subscription') // returns 'my-subscription'
 */
export class BasicSubscriptionNamingStrategy implements SubscriptionNamingStrategy {
    public generateSubscriptionName(topicName?: string, subscriptionName?: string): string {
        if (subscriptionName) {
            return subscriptionName;
        } else if (topicName) {
            return `${topicName}-sub`;
        }
        throw new InvalidNamingStrategyArgsException(
            'Either topic name or subscription name must be provided for this strategy',
        );
    }
}
