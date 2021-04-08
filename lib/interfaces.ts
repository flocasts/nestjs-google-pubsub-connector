import { GooglePubSubPatternHandler } from './enums';

export interface GooglePubSubPatternHandlerMetadata {
    pattern: string;
    handlerType: GooglePubSubPatternHandler;
}
