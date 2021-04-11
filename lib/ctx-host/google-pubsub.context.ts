import { Message } from '@google-cloud/pubsub';
import { BaseRpcContext } from '@nestjs/microservices/ctx-host/base-rpc.context';

type PubSubContextArgs = [
    // The incoming message
    Message,
    // The raw handler metadata
    string,
    // Auto ack
    boolean,
    // Auto nack
    boolean,
];

/**
 * Context for an incoming Google PubSub message
 */
export class GooglePubSubContext extends BaseRpcContext<PubSubContextArgs> {
    constructor(args: PubSubContextArgs) {
        super(args);
    }

    /**
     * Returns the Pubsub Message instance
     */
    getMessage(): Message {
        return this.args[0];
    }

    /**
     * Returns the raw metadata for the handler
     */
    getRawMetadata(): string {
        return this.args[1];
    }

    /**
     * Whether the message attached to this context should be auto-acked
     */
    getAutoAck(): boolean {
        return this.args[2];
    }

    /**
     * Whether the message attached to this context should be auto-acked
     */
    setAutoAck(value: boolean): void {
        this.args[2] = value;
    }

    /**
     * Whether the message attached to this context should be auto-nacked
     */
    getAutoNack(): boolean {
        return this.args[3];
    }

    /**
     * Whether the message attached to this context should be auto-nacked
     */
    setAutoNack(value: boolean): void {
        this.args[3] = value;
    }
}
