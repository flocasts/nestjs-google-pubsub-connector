import { INestMicroservice } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { GooglePubSubTransport } from '../../';
import { ExampleModule } from './example.module';

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
