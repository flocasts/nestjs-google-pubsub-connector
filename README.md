# NestJS Google Pubsub Microservice

This package includes two pieces, a NestJS microservice strategy and a client proxy, to enable
easy integration with Google PubSub.

## Features

- Seamlessly integrate your subscription listeners with the robust NestJS framework
- Creates subscriptions on demand
- Extensible
  - Subscription naming strategies
  - Ack/nack strategies
- Decorators! Decorators!! Decorators!!!

## Microservice Strategy

The server/microservice component is inserted as a strategy when creating a microservice, taking a 
few configuration parameters, as well as an optional PubSub instance.

### Decorators

#### @GooglePubSubMessageHandler
Bread and butter, this takes a subscription name and optionally a topic name. A subscription will be
created if it does not already exits **if**:
- A topic name is supplied
- `createSubscriptions` was set to true when the microservice was created

### @GooglePubSubMessageBody
This will retrieve and `JSON.parse()` the body of the incoming message.

### @Ack
This will return a function that will `ack` the incoming message.
**N.B.** this will disable any auto-acking.

### @Nack
Same as above, but for nacking.


### Subscription creation
If `createSubscriptions` is set as true on setup, then the service will attempt to create a new
subscription if the requested subscription for a handler is not already present.
The microservice takes a `subscriptionNamingStrategy` as an argument, which expects a class conforming
to the `SubscriptionNamingStrategy` interface. A basic strategy is included by default:

```typescript
import {
    SubscriptionNamingStrategy
} from '@flosports/nestjs-google-pubsub-microservice';

export class BasicSubscriptionNamingStrategy implements SubscriptionNamingStrategy {
    public generateSubscriptionName(topicName: string, subscriptionName: string): string {
        return `${topicName}-${subscriptionName}`;
    }
}
```

The string returned from this strategy will be used as the name for the created subscription.

### Usage
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import {
    GooglePubSubTransport
} from '@flosports/nestjs-google-pubsub-microservice';
import { TestModule } from './test.module';

async function bootstrap() {
    const app = await NestFactory.createMicroservice(TestModule, {
        strategy: new GooglePubSubTransport({
            createSubscriptions: true,
            // The microservice will configure its own PubSub instance, but you're free to
            // supply your own
            // client: new PubSub
        }),
    });
    return app.listen(() => {
        console.log('app started!');
    });
}
bootstrap();

// src/test.module.ts
import { Module } from "@nestjs/common";
import { TestController } from "./test.controller";

@Module({
    controllers: [TestController],
})
export class TestModule {
}

// src/test.controller.ts
import { Controller } from '@nestjs/common';
import {
    GooglePubSubMessageBody,
    GooglePubSubMessageHandler
} from '@flosports/nestjs-google-pubsub-microservice';
@Controller()
export class TestController {
    constructor(
        private readonly diService: DiService;
    ) { }
    @GooglePubSubMessageHandler({
        subscriptionName: 'my-existing-subscription',
    })
    public handler1(@GooglePubSubMessageBody() data: { foo: boolean }): void {
        return this.diService.handleFoo(data);
    }

    @GooglePubSubMessageHandler({
        subscriptionName: 'my-subscription-that-or-may-not-exist',
        topicName: 'my-existing-topic'
    })
    public handler2(@GooglePubSubMessageBody() data: { bar: boolean }): void {
        return this.diService.handleBar(data);
    }
}
```

## Client Proxy

This library also provides a basic client proxy that wraps a PubSub instance.

### Usage
```typescript

import {
    ClientGooglePubSub
} from '@flosports/nestjs-google-pubsub-microservice';

const msg = 'beam me up scotty';

new ClientGooglePubSub()
    .publishToTopic(
        'my-test-topic',
        Buffer.from(msg),
    );
```