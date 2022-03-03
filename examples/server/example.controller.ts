import { Controller } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GooglePubSubMessageBody, GooglePubSubMessageHandler } from '../..';
import { GooglePubSubMessageMessageAttributes } from '../../lib/decorators/google-pubsub-message-attributes.decorator';
import { ExampleService } from './example.service';
@Controller()
export class ExampleController {
    constructor(private readonly exampleService: ExampleService) {}

    @GooglePubSubMessageHandler({
        subscriptionName: 'lee-christmas-notifications',
        createOptions: {
            enableMessageOrdering: true,
            retainAckedMessages: false,
        },
        topicName: 'expendables-headquarters',
    })
    public expendablesHandler(
        @GooglePubSubMessageBody() data: { expendable: boolean },
        @GooglePubSubMessageMessageAttributes() attrs: { contractId: string },
    ): boolean {
        return this.exampleService.doStuff(data, attrs);
    }

    @GooglePubSubMessageHandler({
        subscriptionName: 'transport-jobs',
    })
    public theTransporterHandler(
        @GooglePubSubMessageBody('trunkClosed') trunkClosed: boolean,
        @GooglePubSubMessageMessageAttributes('licenseNum') licenseNum: number,
    ): Promise<unknown> {
        return this.exampleService.doStuffAsync(trunkClosed, licenseNum);
    }

    @GooglePubSubMessageHandler({
        topicName: 'health-stats',
    })
    public crankHandler(
        @GooglePubSubMessageBody('heartRate') heartRate: number,
    ): Observable<unknown> {
        return this.exampleService.doStuffObservable(heartRate);
    }
}
