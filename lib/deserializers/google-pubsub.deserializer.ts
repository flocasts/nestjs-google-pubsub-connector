import { Message as GooglePubSubMessage } from '@google-cloud/pubsub';
import { Deserializer, ReadPacket } from '@nestjs/microservices';

export class GooglePubSubMessageDeserializer
    implements Deserializer<GooglePubSubMessage, ReadPacket<GooglePubSubMessage>> {
    deserialize(
        value: GooglePubSubMessage,
        options: { metadata: string },
    ): ReadPacket<GooglePubSubMessage> {
        return {
            pattern: options.metadata,
            data: value,
        };
    }
}
