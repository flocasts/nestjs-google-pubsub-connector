import { applyDecorators } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

export function Subscription(subscriptionName: string) {
    return applyDecorators(EventPattern(subscriptionName));
}
