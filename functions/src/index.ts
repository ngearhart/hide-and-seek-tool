import { setGlobalOptions } from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";

const JAWG_API_TOKEN = defineSecret('JAWG_API_TOKEN');


// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

export const helloWorld = onCall((request) => {
    const text = request.data.text;
    // Authentication / user information is automatically added to the request.
    const uid = request.auth?.uid || null;
    const name = request.auth?.token.name || null;
    const picture = request.auth?.token.picture || null;
    const email = request.auth?.token.email || null;


    logger.info("Hello logs!", { structuredData: true });
    return {
        "hi": "hi",
        "text": text,
        "uid": uid,
        "name": name,
        "picture": picture,
        "email": email,
        "JAWG_API_TOKEN": JAWG_API_TOKEN,
    }
    // response.send(`Hello from Firebase - I have JAWG Token ${JAWG_API_TOKEN.value()}`);
    //https://firebase.google.com/docs/hosting/manage-cache
    //   res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
});
