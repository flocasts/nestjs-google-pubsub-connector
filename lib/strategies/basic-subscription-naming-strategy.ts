import { SubscriptionNamingStrategy } from '../interfaces';

export class BasicSubscriptionNamingStrategy implements SubscriptionNamingStrategy {
    public generateSubscriptionName(topicName: string, subscriptionName?: string): string {
        if (subscriptionName) {
            return subscriptionName;
        }
        return `${topicName}-sub`;
    }
}
