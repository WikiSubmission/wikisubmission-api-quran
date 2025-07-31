import { WRoute } from "../types/w-route";
import { getRandomVerseWithOptions } from "../utils/random-content";
import { parseQuranQuery } from "../utils/parse-quran-query";

export default function route(): WRoute {
    return {
        url: "/random-verse",
        method: "GET",
        handler: async (req, res) => {
            const parsedRequest = parseQuranQuery("random-verse", req.query);
            const { parsed_options } = parsedRequest;

            const verses = getRandomVerseWithOptions(parsed_options);
            
            res.code(200).send({
                message: `Found 1 random verse`,
                request: parsedRequest,
                response: {
                    data: verses,
                },
            });
        },
    };
}