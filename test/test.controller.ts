import { Controller } from '@nestjs/common';
import { GooglePubSubHandler } from '../lib/decorators';
import { GooglePubSubMessageBody } from '../lib/decorators/google-pubsub-message.decorator';

@Controller()
export class TestController {
    @GooglePubSubHandler({
        subscriptionName: 'harolds-test-topic-sub',
    })
    public fooHandler(@GooglePubSubMessageBody() data: { foo: boolean }): void {
        console.dir(data);
    }

    @GooglePubSubHandler({
        subscriptionName: 'harolds-test-topic-sub-2',
        topicName: 'harolds-test-topic',
    })
    public barHandler(@GooglePubSubMessageBody() data: { foo: boolean }): void {
        console.dir(data);
    }
}
