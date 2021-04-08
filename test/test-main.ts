import { NestFactory } from '@nestjs/core';
import { ClientGooglePubSub } from '../lib/client';
import { GooglePubSubTransport } from '../lib/server';
import { TestModule } from './test.module';

/**
 * Configure and run the HTTP nest application.
 */
async function bootstrap() {
    const app = await NestFactory.createMicroservice(TestModule, {
        strategy: new GooglePubSubTransport()
    });
    return app.listen(() => {
        console.log('app started!')
    })
}
bootstrap();
