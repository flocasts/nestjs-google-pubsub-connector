import { TopicNamingStrategy } from '../interfaces';

/**
 * The default strategy for naming topics
 *
 * @remarks
 * When used, the initial string value will remain the same. A topic
 * passed in as `'hello-world'` will create the topic name `'hello-world'`.
 */
export class BasicTopicNamingStrategy implements TopicNamingStrategy {
    public generateTopicName(s: string): string {
        return s;
    }
}
