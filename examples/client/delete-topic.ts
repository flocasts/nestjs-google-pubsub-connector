import { ClientGooglePubSub } from '../../';

const topicName: string | undefined = process.argv[2];

function printHelp() {
    console.log(`Usage: ${process.argv0} ${process.argv[1]} TOPIC_NAME`);
}

function deleteTopic(topic: string) {
    const client = new ClientGooglePubSub();

    return client.deleteTopic(topic).toPromise();
}

if (!topicName) {
    printHelp();
    process.exit(1);
}

deleteTopic(topicName)
    .then(() => console.log(`Topic ${topicName} deleted!`))
    .catch((error) =>
        console.log(`An error occurred while deleting ${topicName}: ${error.message}`),
    )
    .finally(() => process.exit(0));
