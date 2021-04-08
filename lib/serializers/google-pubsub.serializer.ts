import { v4 as uuidv4 } from 'uuid';
import { Message } from '@google-cloud/pubsub';
import { Serializer, OutgoingResponse, WritePacket } from '@nestjs/microservices';

export class GooglePubSubMessageSerializer implements Serializer<WritePacket, OutgoingResponse> {
    serialize(value: any): OutgoingResponse {
        return value;
    }
}
