import { WRoute } from "../types/w-route";
import { Quran } from "../data/data-quran";
import { QuranWordByWord } from "../data/data-quran-word-by-word";
import { QuranChapters } from "../data/data-quran-chapters";
import { QuranForeign } from "../data/data-quran-foreign";
import { parseQueryString } from "../utils/parse-query-string";
import { parseSupplementalQueries } from "../utils/parse-supplemental-queries";

export default function route(): WRoute {
    const dataMap: Record<string, { data: any[]; label: string }> = {
        "quran": { data: Quran.data, label: "ws-quran" },
        "quran-word-by-word": { data: QuranWordByWord.data, label: "ws-quran-word-by-word" },
        "quran-chapters": { data: QuranChapters.data, label: "ws-quran-chapters" },
        "quran-foreign": { data: QuranForeign.data, label: "ws-quran-foreign" },
    };

    return {
        url: "/data/:query",
        method: "GET",
        handler: async (req, res) => {
            const query = parseQueryString(req.query, req.params);
            const previewMode = parseSupplementalQueries<{ preview: boolean }>(req.query).preview === true;
            const entry = dataMap[query as keyof typeof dataMap];

            console.log(previewMode);

            if (!entry) {
                return res.status(404).send({ error: `Unknown data type: "${query}"` });
            }

            const json = JSON.stringify(previewMode ? entry.data.slice(0, 19) : entry.data, null, 2);
            res.header("Content-Type", "application/json");

            if (!previewMode) {
                const date = new Date().toISOString().split("T")[0];
                res.header("Content-Disposition", `attachment; filename=${entry.label}_${date}.json`);
            }

            res.send(json);
        },
    };
}