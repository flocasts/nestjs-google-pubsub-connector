import { SubscriptionNamingStrategy } from '../interfaces';

export class BasicSubscriptionNamingStrategy implements SubscriptionNamingStrategy {
    public generateSubscriptionName(topicName: string): string {
        return `${topicName}-sub`;
    }
}
