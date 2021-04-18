# NestJS Google Pubsub Connector

This package includes two pieces, a NestJS microservice strategy and a client proxy, to enable
easy integration with Google PubSub.

## Features

- Seamlessly integrate your subscription listeners with the robust NestJS framework!
- Creates subscriptions on demand, with self-service naming strategies!
- Extensible:
  - Subscription naming strategies!
  - Ack/nack strategies!
- Decorators! Decorators!! Decorators!!!

## Microservice Strategy

The server/microservice component is inserted as a strategy when creating a microservice, taking a 
few configuration parameters, as well as an optional PubSub instance.

### Decorators

| Name | Desscription |
-------|-----------
| @GooglePubSubMessageHandler | Takes a subscription name and optionally a topic name. A subscription will be created if it does not already exits **if**: a topic name is supplied  **and** `createSubscriptions` was set to true when the microservice was created |
| @GooglePubSubMessageBody | This will retrieve and `JSON.parse()` the body of the incoming message. You may optionally include a key and the corresponding value will be returned.
| @GooglePubSubMessageAttributes | This will retrieve attributes of the incoming message. You may optionally include a key, and the corresponding value will be returned.
| @Ack | This will return a function that will `ack` the incoming message. </br> **N.B.** this will disable any auto-acking.|
| @Nack | Same as above, but for nacking. |

### Subscription creation
If `createSubscriptions` is set as true on transporter setup, then the service will
attempt to create a new subscription if the requested subscription for a handler is
not already present.The microservice takes a `subscriptionNamingStrategy` as an
argument, which expects a class conforming to the `SubscriptionNamingStrategy`
interface. A basic strategy is included by default:
```typescript
import {
    SubscriptionNamingStrategy
} from '@flosports/nestjs-google-pubsub-microservice';

export class BasicSubscriptionNamingStrategy
    implements SubscriptionNamingStrategy {
    public generateSubscriptionName(
        topicName: string,
        subscriptionName?: string
    ): string {
        if (subscriptionName) {
            return subscriptionName;
        }
        return `${topicName}-sub`
    }
}
```

The string returned from this strategy will be used as the name for the created subscription.

### Acking and Nacking
In the interest of giving you, the user, the power over your own destiny this
library takes both a "hands off" and "just works" approach to acking and nacking
messages. This is accomplished through "strategies" confirming to the `AckStrategy`,
`NackStrategy` interfaces which are supplied at transport creation.

#### Ack Strategies
Ack strategies are guaranteed to run after a handler completes successfully, and
expose functions for acking and nacking the message, as well as the messages
`GooglePubSubContext`. The default is shown in the example below:
```typescript
import { GooglePubSubContext } from '../ctx-host';
import { AckFunction, AckStrategy, NackFunction } from '../interfaces';

export class BasicAckStrategy implements AckStrategy {
    public ack(ack: AckFunction, nack: NackFunction, ctx: GooglePubSubContext): Promise<void> {
        if (ctx.getAutoAck()) {
            ack();
        }
        return Promise.resolve();
    }
}
```

The flow here is simple, if autoAck is set to true then this message will be acked
and the function will return.

#### Nack Strategies
Nack strategies are guaranteed to run if any error is thrown from the handler.
</br>
_**N.B.** This will occur _after_ exception filters._
</br>
The signature is the same as an ack strategies with the exception of the thrown Error
(pun intended) being included as the first argument. The default is shown below:

```typescript
import { GooglePubSubContext } from '../ctx-host';
import { AckFunction, NackFunction, NackStrategy } from '../interfaces';

export class BasicNackStrategy implements NackStrategy {
    public nack(
        error: Error,
        ack: AckFunction,
        nack: NackFunction,
        ctx: GooglePubSubContext,
    ): Promise<void> {
        if (ctx.getAutoNack()) {
            nack();
        }
        return Promise.resolve();
    }
}
```

#### No strategy/hybrid acking and nacking
In addition to using these strategies, the library also makes available ack and nack 
functions through decorators to the controller as well as from
the `GooglePubSubContext`. When ack or nack functions are 
retrieved from the context (either directly or through the 
decorator) **the autoAck/autoNack methods will return false**,
disabling the basic strategies and optionally any strategies you
should choose to create. </br>

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
    public handler2(@GooglePubSubMessageBody('bar') bar:  boolean ): void {
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

### Examples

A working example server can be found in the [examples directory](examples).

#### Prerequisites for running the example server
In order to run the example server you must either:
* Have `GOOGLE_APPLICATION_CREDENTIALS` set in your environment, and pointed to a valid credentials, or
* Have a running PubSub emulator and have `PUBSUB_EMULATOR_HOST` set in your environment

In both cases you will need to create any topics present in the example server (or change them to
topics) that already exist.

#### Running the example server
To run the server, simply invoke the provided `npm` script:
```sh
npm run example:server
```
Assuming all prerequisites are met you should see something like the following:
```sh
> @flosportsinc/nestjs-google-pubsub-connector@0.0.0-development example:server /Users/haroldwaters/repos/nestjs-google-pubsub-transport
> node --inspect -r ts-node/register examples/server/main.ts

Debugger listening on ws://127.0.0.1:9229/d23772bb-0e6d-40f8-b47d-d0fc94c7c8c2
For help, see: https://nodejs.org/en/docs/inspector
[Nest] 90792   - 04/17/2021, 7:04:02 PM   [NestFactory] Starting Nest application...
[Nest] 90792   - 04/17/2021, 7:04:02 PM   [InstanceLoader] ExampleService dependencies initialized +28ms
[Nest] 90792   - 04/17/2021, 7:04:02 PM   [InstanceLoader] ExampleModule dependencies initialized +0ms
[Nest] 90792   - 04/17/2021, 7:04:02 PM   [NestMicroservice] Nest microservice successfully started +5ms
[Nest] 90792   - 04/17/2021, 7:04:02 PM   [GooglePubSubTransport] Mapped {projects/flosports-174016/subscriptions/lee-christmas-notifications} handler
example app started!
```