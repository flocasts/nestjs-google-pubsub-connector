import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';

export class InvalidNamingStrategyArgsException extends RuntimeException {
    constructor(message: string) {
        super(message);
    }
}
