import { applyDecorators } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { GooglePubSubPatternMetadata } from '../interfaces';

export function GooglePubSubMessageHandler(metadata: GooglePubSubPatternMetadata) {
    return applyDecorators(EventPattern(JSON.stringify(metadata)));
}
