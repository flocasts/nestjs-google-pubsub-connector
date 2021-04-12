import { SubscriptionNamingStrategy } from '../interfaces';

export class BasicSubscriptionNamingStrategy implements SubscriptionNamingStrategy {
    public generateSubscriptionName(topicName: string, subscriptionName: string): string {
        return `${topicName}-${subscriptionName}`;
    }
}
