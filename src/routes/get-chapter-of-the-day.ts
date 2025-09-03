import { WRoute } from "../types/w-route";
import { getChapterOfTheDayWithOptions } from "../utils/random-content";
import { parseQuranQuery } from "../utils/parse-quran-query";

export default function route(): WRoute {
    return {
        url: "/chapter-of-the-day",
        method: "GET",
        cache: {
            duration: 1,
            durationType: "minutes"
        },
        handler: async (req, res) => {
            const parsedRequest = parseQuranQuery("chapter-of-the-day", req.query);
            const { parsed_options } = parsedRequest;

            const verses = await getChapterOfTheDayWithOptions(parsed_options);

            res.code(200).send({
                message: `Success`,
                request: parsedRequest,
                response: {
                    data: verses,
                    copyright: {
                        text: "© Rashad Khalifa, Ph.D.",
                        url: "https://www.masjidtucson.org/submission/faq/rashad_khalifa_summary.html",
                    },
                },
            });
        },
    };
}