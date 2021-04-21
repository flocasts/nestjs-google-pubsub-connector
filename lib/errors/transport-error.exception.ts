import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';

export class TransportError extends RuntimeException {
    public pattern: string;
    public knownHandlers: string[];
    constructor(message: string, pattern: string, knownHandlers: string[]) {
        super(`An error has occurred in the GooglePubSub transport: ${message}`);
        this.pattern = pattern;
        this.knownHandlers = knownHandlers;
    }
}
