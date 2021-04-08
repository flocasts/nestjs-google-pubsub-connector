import { Message } from '@google-cloud/pubsub';
import { BaseRpcContext } from '@nestjs/microservices/ctx-host/base-rpc.context';

type PubSubContextArgs = [Message, string, boolean];

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
     * Returns the name of the subscription
     */
    getPattern(): string {
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
}
