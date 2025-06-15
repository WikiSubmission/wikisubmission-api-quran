import { WRoute } from "../types/w-route";
import { WResult } from "../types/w-result";
import { Quran } from "../data/data-quran";

export default function route(): WRoute {
    return {
        url: "/random-chapter",
        method: "GET",
        handler: async (req, res) => {
            const randomChapterInt = Math.floor(Math.random() * (114 - 1 + 1) + 1);

            const result =
                Quran.data.length > 0
                    ? Quran.data.filter((i) => i.chapter_number === randomChapterInt)
                    : [];

            res.code(result ? 200 : 404).send({
                message: result ? `Found random chapter: ${result[0].chapter_number}` : "No random chapter found",
                request: {
                    type: "chapter",
                    raw_query: "random-chapter",
                    parsed_query: {
                        chapter: randomChapterInt,
                    },
                    parsed_options: {},
                },
                response: {
                    data: result.sort((a, b) => a.verse_index - b.verse_index) || [],
                    copyright: {
                        text: "Dr. Rashad Khalifa, Ph.D.",
                        url: "https://masjidtucson.org/"
                    }
                },
            } as WResult);
        },
    };
}
