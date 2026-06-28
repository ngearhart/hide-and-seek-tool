import { setGlobalOptions, https } from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { SearchForFeaturesRequest } from "./models";
import { normalizeInverse } from "./geo";
import getFeatures from "./features";
import { OverpassApiStatusError, OverpassGatewayTimeoutError } from "overpass-ts";


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

export const loadNewFeatures = onCall({ enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true" }, async (request) => {
    const requestData = SearchForFeaturesRequest.safeParse(request.data);

    if (!requestData.success) {
        throw new https.HttpsError("invalid-argument", requestData.error.message);
    }
    
    const boundPoints = normalizeInverse(requestData.data.corner1, requestData.data.corner2);
    const bounds = [boundPoints.bottomLeft.lat, boundPoints.bottomLeft.lng, boundPoints.topRight.lat, boundPoints.topRight.lng].join(", ");

    logger.info(`Request received for type: ${requestData.data.featureType} for bounds: ${bounds}`);

    try {
        return await getFeatures(bounds, requestData.data.featureType);
    } catch (e) {
        logger.error(e);
        if (e instanceof OverpassGatewayTimeoutError) {
            throw new https.HttpsError("resource-exhausted", "API Gateway Timeout - Try again Later");
        } else if (e instanceof OverpassApiStatusError) {
            throw new https.HttpsError("resource-exhausted", "API Status Error - Try again Later");
        } else {
            throw new https.HttpsError("internal", "Unknown API error");
        }
    }
});
