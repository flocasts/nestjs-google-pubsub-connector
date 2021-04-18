import { ClientGooglePubSub } from '../../';

const subscriptionName: string | undefined = process.argv[2];

function printHelp() {
    console.log(`Usage: ${process.argv0} ${process.argv[1]} SUBSCRIPTION_NAME`);
}

function deleteSubscription(subscription: string) {
    const client = new ClientGooglePubSub();

    return client.deleteSubscription(subscription).toPromise();
}

if (!subscriptionName) {
    printHelp();
    process.exit(1);
}

deleteSubscription(subscriptionName)
    .then(() => console.log(`Subscription ${subscriptionName} deleted!`))
    .catch((error) =>
        console.log(`An error ocurred while deleting ${subscriptionName}: ${error.message}`),
    )
    .finally(() => process.exit(0));
