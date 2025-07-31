import { WRoute } from "../types/w-route";
import { getVerseOfTheDay } from "../utils/random-content";

export default function route(): WRoute {
    return {
        url: "/verse-of-the-day",
        method: "GET",
        handler: async (req, res) => {
            const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
            const verse = await getVerseOfTheDay();
            const verseId = verse?.verse_id || "1:1";

            res.code(302).redirect(`/${verseId}${queryString ? `?${queryString}` : ""}`);
        },
    };
}