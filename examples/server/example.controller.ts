import { Controller } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GooglePubSubMessageBody, GooglePubSubMessageHandler } from '../..';
import { ExampleService } from './example.service';
@Controller()
export class ExampleController {
    constructor(private readonly exampleService: ExampleService) {}

    @GooglePubSubMessageHandler({
        subscriptionName: 'lee-christmas-notifications',
        topicName: 'expendables-headquarters',
    })
    public expendablesHandler(@GooglePubSubMessageBody() data: { expendable: boolean }): boolean {
        return this.exampleService.doStuff(data);
    }

    @GooglePubSubMessageHandler({
        subscriptionName: 'transport-jobs',
    })
    public theTransporterHandler(
        @GooglePubSubMessageBody('trunkClosed') trunkClosed: boolean,
    ): Promise<any> {
        return this.exampleService.doStuffAsync(trunkClosed);
    }

    @GooglePubSubMessageHandler({
        topicName: 'health-stats',
    })
    public crankHandler(@GooglePubSubMessageBody('heartRate') heartRate: number): Observable<any> {
        return this.exampleService.doStuffObservable(heartRate);
    }
}
