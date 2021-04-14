import { ClientGooglePubSub } from '../../';

const topicName: string | undefined = process.argv[2];
const message: string | undefined = process.argv[3];

function printHelp() {
    console.log(`Usage: ${process.argv0} ${process.argv[1]} TOPIC_NAME MESSAGE`);
}

function publishMessage(topic: string, message: string) {
    const client = new ClientGooglePubSub();

    return client.publishToTopic(topic, Buffer.from(message)).toPromise();
}

if (!topicName || !message) {
    printHelp();
    process.exit(1);
}

publishMessage(topicName, message)
    .then(() => console.log(`Message published to ${topicName}`))
    .catch((error) => console.log(`An error ocurred while publishing: ${error.message}`))
    .finally(() => process.exit(0));
