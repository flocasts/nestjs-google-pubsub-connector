import { ClientGooglePubSub } from "../lib/client";

const foo = new ClientGooglePubSub();

foo.publishToTopic(
    'harolds-test-topic',
    Buffer.from(JSON.stringify({ foo: 'bar' })),
)
    .toPromise()
    .then((d: any) => {
        console.log(`Message sent: ${d}`);
    })
    .catch((e: any) => {
        console.log(e);
        console.dir(e);
    });