<h1 align="center">NestJS Google Pubsub Connector</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/@flosportsinc/nestjs-google-pubsub-connector">
    <img alt="npm latest version" src="https://img.shields.io/npm/v/@flosportsinc/nestjs-google-pubsub-connector/latest.svg" />
  </a>
</p>

This package includes two pieces, a NestJS microservice strategy as well as a client proxy. Together this enables
easy integration with Google PubSub in a NestJS-y way.

## Features

-   Seamlessly integrate your subscription listeners as controllers in the robust NestJS framework!
-   Creates subscriptions on demand, with self-service naming strategies!
-   A "just-works" approach means that zero configuration is needed out of the box, just insert the
    strategy and let the framework do the rest.
-   Oh-so Extensible:
    -   Subscription naming strategies let you dynamically name subscriptions how _you_ want to!
    -   Ack/nack strategies let you decouple your business logic from how you respond to messages!
-   Decorators! Decorators!! Decorators!!!

## Microservice Strategy

The server/transport strategy component is inserted as a strategy when creating a microservice, taking a
few configuration parameters, as well as an optional PubSub instance, like so:

```typescript
async function bootstrap() {
    const app: INestMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(
        ExampleModule,
        {
            strategy: new GooglePubSubTransport({
                createSubscriptions: true,
                // The microservice will configure its own PubSub instance, but you're free to
                // supply your own
                // client: new PubSub()
            }),
        },
    );

    // It's also possible to connect as a hybrid app:
    // const app = await NestFactory.create(HttpAppModule);
    // const microservice = app.connectMicroservice({
    //      strategy: new GooglePubSubTransport({
    //          createSubscriptions: true,
    //          // The microservice will configure its own PubSub instance, but you're free to
    //          // supply your own
    //          // client: new PubSub
    //      }),
    // });

    return app.listen(() => {
        console.log('example app started!');
    });
}
bootstrap();
```

With just the configuration above you can have working controllers responding to messages in minutes.

### Decorators

Parameter decorators are one of the best ease-of-use features in NestJS, and this library offers a few
that will make parsing PubSub Messages easy, simple and fun:

| Name                                 | Description                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @GooglePubSubMessageHandler          | Takes a subscription name and optionally a topic name and creation parameters of subscription. A subscription will be created if it does not already exits **if**: a topic name is supplied **and** `createSubscriptions` was set to true when the microservice was created. The creation parameters are of type `CreateSubscriptionOptions` from the google pub/sub library |
| @GooglePubSubMessageBody             | This will retrieve and `JSON.parse()` the body of the incoming message. You may optionally include a key and the corresponding value will be returned.                                                                                                                                                                                                                       |
| @GooglePubSubMessageAttributes       | This will retrieve attributes of the incoming message. You may optionally include a key, and the corresponding value will be returned.                                                                                                                                                                                                                                       |
| @GooglePubSubMessageDeliveryAttempts | This will return the number of delivery attempts for this message. Will only be incremented if the subscription has a Dead Letter Queue.                                                                                                                                                                                                                                     |
| @GooglePubSubMessageId               | This will return the ID of the message.                                                                                                                                                                                                                                                                                                                                      |
| @Ack                                 | This will return a function that will `ack` the incoming message. </br> **N.B.** this will disable any auto-acking.                                                                                                                                                                                                                                                          |
| @Nack                                | Same as above, but for nacking.                                                                                                                                                                                                                                                                                                                                              |

### Subscription creation

If `createSubscriptions` is set as true on transporter setup, then the service will
attempt to create a new subscription if the requested subscription for a handler is
not already present.The microservice takes a `subscriptionNamingStrategy` as an
argument, which expects a class conforming to the `SubscriptionNamingStrategy`
interface. A basic strategy is included by default:

```typescript
import { SubscriptionNamingStrategy } from '@flosports/nestjs-google-pubsub-microservice';
import { NamingDependencyTag, SubscriptionNameDependencies } from './interfaces';

export class BasicSubscriptionNamingStrategy implements SubscriptionNamingStrategy {
    public generateSubscriptionName(deps: SubscriptionNameDependencies): string {
        switch (deps._tag) {
            case NamingDependencyTag.TOPIC_AND_SUBSCRIPTION_NAMES:
            case NamingDependencyTag.SUBSCRIPTION_NAME_ONLY:
                return deps.subscriptionName;
            case NamingDependencyTag.TOPIC_NAME_ONLY:
                return `${deps.topicName}-sub`;
        }
    }
}
```

The string returned from this strategy will be used as the name for the created subscription.

### Acking and Nacking

In the interest of giving you, the user, the power over your own destiny this
library takes both a hands-off and "just works" approach to acking and nacking
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
_**N.B.** This will occur \_after_ exception filters.\_
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
        createOptions: {
            enableMessageOrdering: true,
        },
        topicName: 'my-existing-topic'
    })
    public handler2(@GooglePubSubMessageBody('bar') bar:  boolean ): void {
        return this.diService.handleBar(data);
    }
}
```

## Client Proxy

This library also provides a basic client proxy that wraps a PubSub instance.

This proxy supports:

-   Publishing
-   Topic/Subscription creation
-   Topic/Subscription deletion

You can find a number of working examples in the [examples directory](examples/client).

### Usage

```typescript
import { ClientGooglePubSub } from '@flosports/nestjs-google-pubsub-microservice';

const msg = 'beam me up scotty';

new ClientGooglePubSub().publishToTopic('my-test-topic', Buffer.from(msg));
```

### Authentication

In keeping with the hand-off "just works" approach in this library, authentication is handled entirely
by the underlying PubSub client. This means that the credentials pointed to by the `GOOGLE_APPLICATION_CREDENTIALS`
will be used, as well as emulator support if `PUBSUB_EMULATOR_HOST` is set. If you need a more advanced
configuration, then both the transport strategy and the client proxy will take a PubSub client instance
as a constructor parameter - you can simply build the client you need and then hand it off.

### Examples

A working example server can be found in the [examples directory](examples/server).

#### Prerequisites for running the example server

In order to run the example server you must either:

-   Have `GOOGLE_APPLICATION_CREDENTIALS` set in your environment, and pointed to a valid credentials, or
-   Have a running PubSub emulator and have `PUBSUB_EMULATOR_HOST` set in your environment

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
