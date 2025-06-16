import { QuranRootWords } from "../../data/data-quran-root-words";
import { Database } from "../../types/generated/database.types";
import { WRoute } from "../../types/w-route";
import { parseQueryString } from "../../utils/parse-query-string";

/**
 * Returns all verses containing a given root (e.g. ر ح م) word using pre-processed data to avoid heavy computations.
 * Useful for "expanded" data on verse displays.
 */
export default function route(): WRoute {
    return {
        url: "/verses-with-root/:query?",
        method: "GET",
        handler: async (req, res) => {
            const query = parseQueryString(req.query, req.params);

            if (!query) {
                res.code(400).send({ error: "A valid query is required" });
                return;
            }

            const result = QuranRootWords[query as keyof typeof QuranRootWords];

            if (!result) {
                res.code(404).send({ error: `No verses found found with root '${query}'` });
                return;
            }

            res.code(200).send(result as Database["public"]["Tables"]["ws-quran-word-by-word"]["Row"][]);
        },
    };
}