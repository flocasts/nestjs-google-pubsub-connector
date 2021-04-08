import { Message } from '@google-cloud/pubsub';
import { Deserializer, IncomingRequest, IncomingResponse } from '@nestjs/microservices';

export class GooglePubSubMessageDeserializer implements Deserializer<Message, IncomingRequest> {
    deserialize(value: Message, options: { pattern: string }): IncomingRequest {
        return {
            id: value.id,
            pattern: options.pattern,
            data: JSON.parse(value.data.toString()),
        };
    }
}
