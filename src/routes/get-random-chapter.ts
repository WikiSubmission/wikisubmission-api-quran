import { WRoute } from "../types/w-route";

export default function route(): WRoute {
    return {
        url: "/random-chapter",
        method: "GET",
        handler: async (req, res) => {
            const randomChapterInt = Math.floor(Math.random() * (114 - 1 + 1) + 1);

            const queryString = new URLSearchParams(req.query as Record<string, string>).toString();

            res.code(302).redirect(`/${randomChapterInt}${queryString ? `?${queryString}` : ""}`);
        },
    };
}
