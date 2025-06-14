import { WRoute } from "../types/w-route";
import { WResult } from "../types/w-result";
import { Quran } from "../data/data-quran";

export default function route(): WRoute {
    return {
        url: "/random-verse",
        method: "GET",
        handler: async (req, res) => {
            const result =
                Quran.data.length > 0
                    ? [Quran.data[Math.floor(Math.random() * Quran.data.length)]]
                    : [];

            res.code(result ? 200 : 404).send({
                message: result ? `Found random verse: ${result[0].verse_id}` : "No random verse found",
                request: {
                    type: "verse",
                    raw_query: "random-verse",
                    parsed_query: {
                        chapter: result[0].chapter_number,
                        verse: result[0].verse_number,
                    },
                    parsed_options: {},
                    standard_url: "/random-verse",
                },
                response: {
                    data: result || [],
                    copyright: {
                        text: "Dr. Rashad Khalifa, Ph.D.",
                        url: "https://masjidtucson.org/"
                    }
                },
            } as WResult);
        },
    };
}
