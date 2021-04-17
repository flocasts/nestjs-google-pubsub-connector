import { DynamicModule, Module, Provider } from '@nestjs/common';
import { GOOGLE_PUBSUB_CLIENT_TOKEN, GOOGLE_PUBSUB_MODULE_OPTIONS } from '../constants';
import {
    GooglePubSubModuleAsyncOptions,
    GooglePubSubModuleOptionsFactory,
    GooglePubSubOptions,
} from '../interfaces';
import { ClientGooglePubSub } from './client-google-pubsub';

// This bit is adapted from the built from http-service:
// https://github.com/nestjs/nest/tree/6a61a593b9d388144ea5497909c03612c298214c/packages/common/http
@Module({
    providers: [
        {
            provide: GOOGLE_PUBSUB_CLIENT_TOKEN,
            useValue: ClientGooglePubSub,
        },
    ],
    exports: [GOOGLE_PUBSUB_CLIENT_TOKEN],
})
export class GooglePubSubModule {
    static register(options: GooglePubSubOptions): DynamicModule {
        return {
            module: GooglePubSubModule,
            providers: [
                {
                    provide: GOOGLE_PUBSUB_CLIENT_TOKEN,
                    useValue: ClientGooglePubSub.create(options),
                },
            ],
        };
    }

    static registerAsync(options: GooglePubSubModuleAsyncOptions): DynamicModule {
        return {
            module: GooglePubSubModule,
            imports: options.imports,
            providers: [
                ...this.createAsyncProviders(options),
                {
                    provide: GOOGLE_PUBSUB_CLIENT_TOKEN,
                    useFactory: (config: GooglePubSubOptions) => ClientGooglePubSub.create(config),
                    inject: [GOOGLE_PUBSUB_MODULE_OPTIONS],
                },
                ...(options.extraProviders || []),
            ],
        };
    }

    private static createAsyncProviders(options: GooglePubSubModuleAsyncOptions): Provider[] {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncOptionsProvider(options)];
        }
        return [
            this.createAsyncOptionsProvider(options),
            {
                // TODO: Change the options to a conditional type so we can be assured _at least_
                // one of these is present
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                provide: options.useClass,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                useClass: options.useClass,
            },
        ];
    }

    private static createAsyncOptionsProvider(options: GooglePubSubModuleAsyncOptions): Provider {
        if (options.useFactory) {
            return {
                provide: GOOGLE_PUBSUB_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }
        return {
            provide: GOOGLE_PUBSUB_MODULE_OPTIONS,
            useFactory: async (optionsFactory: GooglePubSubModuleOptionsFactory) =>
                optionsFactory.createGooglePubSubOptions(),
            // TODO: Change the options to a conditional type so we can be assured _at least_
            // one of these is present
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            inject: [options.useExisting || options.useClass],
        };
    }
}
