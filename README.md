# NestJS Google Pubsub Microservice

This package includes two pieces, a NestJS microservice strategy and a client proxy, to enable
easy integration with Google PubSub.

## Microservice Strategy

The server/microservice component is inserted as a strategy when creating a microservice, taking a 
few configuration parameters, as well as an optional PubSub instance.

### Usage
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { GooglePubSubTransport } from '@flosports/nestjs-google-pubsub-microservice';
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
import { GooglePubSubMessageBody, GooglePubSubMessageHandler } from '@flosports/nestjs-google-pubsub-microservice';
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