import { Message } from '@google-cloud/pubsub';
import { PatternMetadata } from '@nestjs/microservices';
import { BaseRpcContext } from '@nestjs/microservices/ctx-host/base-rpc.context';
import { AckFunction, NackFunction } from '../interfaces';

type PubSubContextArgs = [
    // The incoming message
    Message,
    // The raw handler metadata
    PatternMetadata,
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
    public getMessage(): Message {
        return this.args[0];
    }

    /**
     * Returns the raw metadata for the handler
     */
    public getMetadata(): PatternMetadata {
        return this.args[1];
    }

    public getAckFunction(): AckFunction {
        this.setAutoAck(false);
        return () => this.args[0].ack();
    }

    /**
     * Whether the message attached to this context should be auto-acked
     */
    public getAutoAck(): boolean {
        return this.args[2];
    }

    /**
     * Whether the message attached to this context should be auto-acked
     */
    private setAutoAck(value: boolean): void {
        this.args[2] = value;
    }

    public getNackFunction(): NackFunction {
        this.setAutoNack(false);
        return () => this.args[0].nack();
    }

    /**
     * Whether the message attached to this context should be auto-nacked
     */
    public getAutoNack(): boolean {
        return this.args[3];
    }

    /**
     * Whether the message attached to this context should be auto-nacked
     */
    private setAutoNack(value: boolean): void {
        this.args[3] = value;
    }
}
