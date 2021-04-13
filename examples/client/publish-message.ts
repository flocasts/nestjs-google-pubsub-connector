import { ClientGooglePubSub } from '../../';

const topicName: string = process.argv[2];
const message: string = process.argv[3];

function printHelp() {
    console.log(`Usage: ${process.argv0} ${process.argv[1]} TOPIC_NAME MESSAGE`);
}

function publishMessage() {
    const client = new ClientGooglePubSub();

    return client.publishToTopic(topicName, Buffer.from(message)).toPromise();
}

if (!topicName || !message) {
    printHelp();
    process.exit(1);
}

publishMessage()
    .then(() => console.log(`Message published to ${topicName}`))
    .catch((error) => console.log(`An error ocurred while publishing: ${error.message}`))
    .finally(() => process.exit(0));
