import { Message } from "@google-cloud/pubsub";
import { Controller } from "@nestjs/common";
import { Subscription } from "../lib/decorators";
import { GooglePubSubMessageAck } from "../lib/decorators/google-pubsub-ack.decorator";
import { GooglePubSubMessageBody } from "../lib/decorators/google-pubsub-message.decorator";

@Controller()
export class TestController {
    @Subscription('harolds-test-topic-sub')
    public fooHandler(
        @GooglePubSubMessageBody() data: Message,
        @GooglePubSubMessageAck() ack: ()=> void
    ) {
        console.log(data)
        ack()
    }
}