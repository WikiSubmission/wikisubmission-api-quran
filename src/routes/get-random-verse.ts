import { WRoute } from "../types/w-route";
import { getRandomVerse } from "../utils/random-content";

export default function route(): WRoute {
    return {
        url: "/random-verse",
        method: "GET",
        handler: async (req, res) => {
            const verse = getRandomVerse();
            const verseId = verse?.verse_id || "1:1";

            const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
            res.code(302).redirect(`/${verseId}${queryString ? `?${queryString}` : ""}`);
        },
    };
}ƒ