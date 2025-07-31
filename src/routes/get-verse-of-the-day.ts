import { WRoute } from "../types/w-route";
import { getVerseOfTheDayWithOptions } from "../utils/random-content";
import { parseQuranQuery } from "../utils/parse-quran-query";

export default function route(): WRoute {
    return {
        url: "/verse-of-the-day",
        method: "GET",
        handler: async (req, res) => {
            const parsedRequest = parseQuranQuery("verse-of-the-day", req.query);
            const { parsed_options } = parsedRequest;

            const verses = await getVerseOfTheDayWithOptions(parsed_options);
            
            res.code(200).send({
                message: `Found ${verses.length} verse of the day`,
                request: parsedRequest,
                response: {
                    data: verses,
                },
            });
        },
    };
}