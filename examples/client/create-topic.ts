import { ClientGooglePubSub } from '../../';

const topicName: string | undefined = process.argv[2];

function printHelp() {
    console.log(`Usage: ${process.argv0} ${process.argv[1]} TOPIC_NAME`);
}

function createTopic(topic: string) {
    const client = new ClientGooglePubSub();

    return client.createTopic(topic).toPromise();
}

if (!topicName) {
    printHelp();
    process.exit(1);
}

createTopic(topicName)
    .then(() => console.log(`Topic created ${topicName}`))
    .catch((error) => console.log(`An error ocurred while creating topic: ${error.message}`))
    .finally(() => process.exit(0));
