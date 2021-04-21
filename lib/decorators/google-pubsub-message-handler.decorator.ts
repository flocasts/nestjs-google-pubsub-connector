/* istanbul ignore file */
import { EventPattern } from '@nestjs/microservices';
import { GooglePubSubPatternMetadata } from '../interfaces';

export function GooglePubSubMessageHandler(metadata: GooglePubSubPatternMetadata): MethodDecorator {
    return EventPattern(metadata);
}
