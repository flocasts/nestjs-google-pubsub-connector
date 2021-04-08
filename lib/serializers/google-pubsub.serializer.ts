import { OutgoingResponse, Serializer, WritePacket } from '@nestjs/microservices';

export class GooglePubSubMessageSerializer implements Serializer<WritePacket, OutgoingResponse> {
    serialize(value: any): OutgoingResponse {
        return value;
    }
}
