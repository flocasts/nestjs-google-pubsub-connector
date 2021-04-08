import { applyDecorators, SetMetadata } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { GOOGLE_PUBSUB_HANDLER_TYPE } from '../constants';
import { GooglePubSubPatternHandler } from '../enums';

export function Subscription(subscriptionName: string) {
    return applyDecorators(
        SetMetadata(GOOGLE_PUBSUB_HANDLER_TYPE, GooglePubSubPatternHandler.SUBSCRIPTION),
        EventPattern(subscriptionName),
    );
}
