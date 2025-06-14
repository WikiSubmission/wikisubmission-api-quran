import { WRoute } from "../types/w-route";
import { Quran } from "../data/data-quran";
import { QuranWordByWord } from "../data/data-quran-word-by-word";
import { parseURLQuery } from "../utils/parse-url-query";
import { QuranChapters } from "../data/data-quran-chapters";

export default function route(): WRoute {
    return {
        url: "/data/:query",
        method: "GET",
        handler: async (req, res) => {
            const query = parseURLQuery(req.query, req.params);
            
            const previewMode = (req.query as { preview: string })?.preview === "true";

            if (query === "quran-word-by-word") {
                if (previewMode) {
                    res.header("Content-Type", "application/json");
                    res.send(JSON.stringify(QuranWordByWord.data.slice(0, 100), null, 2));
                    return;
                }
                res.header("Content-Type", "application/json");
                res.header(`content-disposition`, `attachment; filename=ws-quran-word-by-word_${new Date().toISOString().split("T")[0]}.json`);
                res.send(JSON.stringify(QuranWordByWord.data, null, 2));
            } else if (query === "quran-chapters") {
                if (previewMode) {
                    res.header("Content-Type", "application/json");
                    res.send(JSON.stringify(QuranChapters.data.slice(0, 100), null, 2));
                    return;
                }
                res.header("Content-Type", "application/json");
                res.header(`content-disposition`, `attachment; filename=ws-quran-chapters_${new Date().toISOString().split("T")[0]}.json`);
                res.send(JSON.stringify(QuranChapters.data, null, 2));
            } else if (query === "quran") {
                if (previewMode) {
                    res.header("Content-Type", "application/json");
                    res.send(JSON.stringify(Quran.data.slice(0, 100), null, 2));
                    return;
                }
                res.header("Content-Type", "application/json");
                res.header(`content-disposition`, `attachment; filename=ws-quran_${new Date().toISOString().split("T")[0]}.json`);
                res.send(JSON.stringify(Quran.data, null, 2));
            } else {
                res.status(404).send({
                    error: `Unknown data type: "${query}"`
                });
            }
        },
    };
}
