import { Message } from "@google-cloud/pubsub";
import { CanActivate, Controller, ExecutionContext, UseGuards } from "@nestjs/common";
import { Ctx } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { GooglePubSubContext } from "../lib";
import { Subscription } from "../lib/decorators";
import { GooglePubSubMessageAck } from "../lib/decorators/google-pubsub-ack.decorator";
import { GooglePubSubMessageBody } from "../lib/decorators/google-pubsub-message.decorator";


@Controller()
export class TestController {
    @Subscription('harolds-test-topic-sub')
    public fooHandler(
        @GooglePubSubMessageBody() data: { foo: boolean },
        @GooglePubSubMessageAck() ackackackack: () => void,
        @Ctx() ctx: GooglePubSubContext,
    ) {
        console.dir(data)
    }
}