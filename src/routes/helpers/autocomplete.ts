import { WRoute } from "../../types/w-route";
import { WResult } from "../../types/w-result";
import { parseQuranQuery } from "../../utils/parse-quran-query";
import { parseURLQuery } from "../../utils/parse-url-query";

/**
 * Returns detected Quranic parameters of the request based on possible `request` interface types defined in types/w-result.ts.
 * Useful for pre-populating the user's input in search bars.
 */
export default function route(): WRoute {
    return {
        url: "/autocomplete/:query",
        method: "GET",
        handler: async (req, res) => {
            const query = parseURLQuery(req.query, req.params);

            if (!query) {
                res.code(400).send({ error: "A valid query is required" });
                return;
            }

            const result = parseQuranQuery(query, req.query as Record<string, string>);
            res.code(200).send(result as WResult["request"]);
        },
    };
}