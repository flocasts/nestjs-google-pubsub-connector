import { NestFactory } from '@nestjs/core';
import { GooglePubSubTransport } from '../lib/server';
import { TestModule } from './test.module';

/**
 * Configure and run the test application.
 */
async function bootstrap() {
    const app = await NestFactory.createMicroservice(TestModule, {
        strategy: new GooglePubSubTransport({
            createSubscriptions: true,
        }),
    });
    return app.listen(() => {
        console.log('app started!');
    });
}
bootstrap();
