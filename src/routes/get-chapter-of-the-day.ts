import { WRoute } from "../types/w-route";
import { getChapterOfTheDay } from "../utils/random-content";

export default function route(): WRoute {
    return {
        url: "/chapter-of-the-day",
        method: "GET",
        handler: async (req, res) => {
            const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
            const chapterNumber = await getChapterOfTheDay();

            res.code(302).redirect(`/${chapterNumber}${queryString ? `?${queryString}` : ""}`);
        },
    };
}