import { Controller } from '@nestjs/common';
import { GooglePubSubMessageBody, GooglePubSubMessageHandler } from '../..';
@Controller()
export class ExampleController {
    @GooglePubSubMessageHandler({
        subscriptionName: 'lee-christmas-notifications',
        topicName: 'expendables-headquarters',
    })
    public expendablesHandler(@GooglePubSubMessageBody() data: { expendable: boolean }): void {
        console.log(`Lee Christmas`);
    }

    @GooglePubSubMessageHandler({
        subscriptionName: 'transport-jobs',
    })
    public theTransporterHandler(
        @GooglePubSubMessageBody('trunkClosed') trunkClosed: boolean,
    ): void {
        console.log(`Frank Martin`);
    }
}
