import { WRoute } from "../types/w-route";
import { getRandomChapterWithOptions } from "../utils/random-content";
import { parseQueryString } from "../utils/parse-query-string";
import { parseQuranQuery } from "../utils/parse-quran-query";

export default function route(): WRoute {
    return {
        url: "/random-chapter",
        method: "GET",
        handler: async (req, res) => {
            const parsedRequest = parseQuranQuery("random-chapter", req.query);
            const { parsed_options } = parsedRequest;

            const verses = getRandomChapterWithOptions(parsed_options);
            
            res.code(200).send({
                message: `Found ${verses.length} verses in random chapter`,
                request: parsedRequest,
                response: {
                    data: verses,
                },
            });
        },
    };
}
