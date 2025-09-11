import { WRoute } from "../types/w-route";
import { parseQueryString } from "../utils/parse-query-string";
import { parseSupplementalQueries } from "../utils/parse-supplemental-queries";

export default function route(): WRoute {
    return {
        url: "/data/:query",
        method: "GET",
        handler: async (req, res) => {
            const query = parseQueryString(req.query, req.params);
            const previewMode =
                parseSupplementalQueries<{ preview: boolean }>(req.query).preview === true;

            // resolve fresh data every request
            const dataMap: Record<
                string,
                { getData: () => any[]; label: string }
            > = {
                "quran": {
                    getData: () => require("../data/data-quran").Quran.data,
                    label: "ws-quran",
                },
                "quran-word-by-word": {
                    getData: () => require("../data/data-quran-word-by-word").QuranWordByWord.data,
                    label: "ws-quran-word-by-word",
                },
                "quran-chapters": {
                    getData: () => require("../data/data-quran-chapters").QuranChapters.data,
                    label: "ws-quran-chapters",
                },
                "quran-foreign": {
                    getData: () => require("../data/data-quran-foreign").QuranForeign.data,
                    label: "ws-quran-foreign",
                },
            };

            const entry = dataMap[query as keyof typeof dataMap];

            if (!entry) {
                return res.status(404).send({ error: `Unknown data type: "${query}"` });
            }

            const data = entry.getData(); // fresh snapshot each call
            const json = JSON.stringify(previewMode ? data.slice(0, 19) : data, null, 2);

            res.header("Content-Type", "application/json");

            if (!previewMode) {
                const date = new Date().toISOString().split("T")[0];
                res.header(
                    "Content-Disposition",
                    `attachment; filename=${entry.label}_${date}.json`
                );
            }

            res.send(json);
        },
    };
}