import { Controller } from '@nestjs/common';
import { GooglePubSubMessageHandler } from '../lib';
import { GooglePubSubMessageBody } from '../lib/decorators/google-pubsub-message-body.decorator';

@Controller()
export class TestController {
    @GooglePubSubMessageHandler({
        subscriptionName: 'harolds-test-topic-sub',
    })
    public fooHandler(@GooglePubSubMessageBody() data: { foo: boolean }): void {
        console.dir(data);
    }

    @GooglePubSubMessageHandler({
        subscriptionName: 'harolds-test-topic-sub-2',
        topicName: 'harolds-test-topic',
    })
    public barHandler(@GooglePubSubMessageBody() data: { foo: boolean }): void {
        console.dir(data);
    }
}
