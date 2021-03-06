import {
    NamingDependencyTag,
    SubscriptionNameDependencies,
    SubscriptionNamingStrategy,
} from '../interfaces';

/**
 * The default strategy for creating subscription names.
 *
 * @remarks
 * If the subscription name is provided, that name will be used directly.
 * If only a topic name is provided, it will be used to generate a
 * subscription name.
 *
 * This strategy only supports one subscription per topic. Implement
 * a custom strategy if you need to have more than one subscription
 * per topic.
 */
export class BasicSubscriptionNamingStrategy implements SubscriptionNamingStrategy {
    public generateSubscriptionName(deps: SubscriptionNameDependencies): string {
        switch (deps._tag) {
            case NamingDependencyTag.TOPIC_AND_SUBSCRIPTION_NAMES:
            case NamingDependencyTag.SUBSCRIPTION_NAME_ONLY:
                return deps.subscriptionName;
            case NamingDependencyTag.TOPIC_NAME_ONLY:
                return `${deps.topicName}-sub`;
        }
    }
}
