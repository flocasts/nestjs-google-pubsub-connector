import { ClientGooglePubSub } from "../lib/client";

const msg = process.argv[2]

new ClientGooglePubSub()
    .publishToTopic(
        'harolds-test-topic',
        Buffer.from(msg),
    )
        .toPromise()
        .then((d: any) => {
            console.log(`Message sent: ${d}`);
        })
        .catch((e: any) => {
            console.log(e);
            console.dir(e);
        });