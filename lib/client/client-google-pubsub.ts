import { ClientConfig as GooglePubSubClientConfig, PubSub } from '@google-cloud/pubsub';
import { DynamicModule, Injectable } from '@nestjs/common';
import {
    ClientProxy,
    Deserializer,
    ReadPacket,
    Serializer,
    WritePacket,
} from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { GooglePubSubMessageDeserializer } from '../deserializers/google-pubsub.deserializer';
import { GooglePubSubMessageSerializer } from '../serializers/google-pubsub.serializer';

export interface GooglePubSubOptions {
    serializer?: Serializer;
    deserializer?: Deserializer;
    pubSubClientConfig?: GooglePubSubClientConfig;
}

@Injectable()
export class ClientGooglePubSub extends ClientProxy {
    private googlePubSubClient: PubSub;

    constructor(options?: GooglePubSubOptions) {
        super();
        this.initializeSerializer(options);
        this.initializeDeserializer(options);
        this.googlePubSubClient = new PubSub(options?.pubSubClientConfig);
    }

    public static register(): DynamicModule {
        return {
            module: ClientGooglePubSub,
        };
    }

    public async close(): Promise<void> {
        await this.googlePubSubClient.close();
    }

    public publishToTopic(topic: string, data: Buffer): Observable<any> {
        return this.emit(topic, data);
    }

    protected dispatchEvent(packet: ReadPacket<any>): Promise<any> {
        const topic = packet.pattern;
        const { data } = this.serializer.serialize(packet);
        return this.googlePubSubClient.topic(topic).publish(data);
    }

    protected initializeDeserializer(options?: GooglePubSubOptions): void {
        this.deserializer = options?.deserializer
            ? options.deserializer
            : new GooglePubSubMessageDeserializer();
    }

    protected initializeSerializer(options?: GooglePubSubOptions): void {
        this.serializer = options?.serializer
            ? options.serializer
            : new GooglePubSubMessageSerializer();
    }

    /**
     * This refers to an internal publish method to NestJS, please use `publishToTopic`.
     */
    protected publish(
        packet: ReadPacket<any>,
        callback: (packet: WritePacket<any>) => void,
    ): Function {
        throw new Error('Method intentionally not implemented.');
    }

    public connect(): Promise<void> {
        return Promise.resolve();
    }
}
