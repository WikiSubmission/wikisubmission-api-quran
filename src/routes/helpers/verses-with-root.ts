import { RootWordMap } from "../../_localdata/ws-root-word-map";
import { WRoute } from "../../types/w-route";
import { parseURLQuery } from "../../utils/parse-url-query";

/**
 * Returns all verses containing a given root (e.g. ر ح م) word using pre-processed data to avoid heavy computations.
 * Useful for "expanded" data on verse displays.
 */
export default function route(): WRoute {
    return {
        url: "/verses-with-root/:query?",
        method: "GET",
        handler: async (req, res) => {
            const query = parseURLQuery(req.query, req.params);

            if (!query) {
                res.code(400).send({ error: "A valid query is required" });
                return;
            }

            const result = RootWordMap[query as keyof typeof RootWordMap];

            if (!result) {
                res.code(404).send({ error: `No verses found found with root '${query}'` });
                return;
            }

            res.code(200).send(result);
        },
    };
}