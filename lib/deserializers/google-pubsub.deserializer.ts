import { Message as GooglePubSubMessage } from '@google-cloud/pubsub';
import { Deserializer, PatternMetadata, ReadPacket } from '@nestjs/microservices';

export class GooglePubSubMessageDeserializer
    implements Deserializer<GooglePubSubMessage, ReadPacket<GooglePubSubMessage>> {
    deserialize(
        value: GooglePubSubMessage,
        options: { metadata: PatternMetadata },
    ): ReadPacket<GooglePubSubMessage> {
        return {
            pattern: options.metadata,
            data: value,
        };
    }
}
