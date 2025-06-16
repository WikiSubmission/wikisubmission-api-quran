import { WRoute } from "../types/w-route";
import { Quran } from "../data/data-quran";

export default function route(): WRoute {
    return {
        url: "/random-verse",
        method: "GET",
        handler: async (req, res) => {
            const verse = Quran.data[Math.floor(Math.random() * Quran.data.length)];
            const verseId = verse?.verse_id || "1:1";

            const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
            res.code(302).redirect(`/${verseId}${queryString ? `?${queryString}` : ""}`);
        },
    };
}