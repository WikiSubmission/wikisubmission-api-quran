import { WRoute } from "../types/w-route";
import { getRandomChapter } from "../utils/random-content";

export default function route(): WRoute {
    return {
        url: "/random-chapter",
        method: "GET",
        handler: async (req, res) => {
            const randomChapterInt = getRandomChapter();

            const queryString = new URLSearchParams(req.query as Record<string, string>).toString();

            res.code(302).redirect(`/${randomChapterInt}${queryString ? `?${queryString}` : ""}`);
        },
    };
}
