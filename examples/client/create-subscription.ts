import { ClientGooglePubSub } from '../../';

const topicName: string | undefined = process.argv[2];
const subscriptionName: string | undefined = process.argv[3];

function printHelp() {
    console.log(`Usage: ${process.argv0} ${process.argv[1]} TOPIC_NAME SUBSCRIPTION_NAME`);
}

function createSubscription(topic: string, subscription: string) {
    const client = new ClientGooglePubSub();

    return client.createSubscription(subscription, topic).toPromise();
}

if (!topicName || !subscriptionName) {
    printHelp();
    process.exit(1);
}

createSubscription(topicName, subscriptionName)
    .then(() => console.log(`Subscription created ${subscriptionName}`))
    .catch((error) =>
        console.log(`An error occurred while creating subscription: ${error.message}`),
    )
    .finally(() => process.exit(0));
