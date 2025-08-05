import { WRoute } from "../types/w-route";
import { WResult } from "../types/w-result";
import { parseQuranQuery } from "../utils/parse-quran-query";
import { parseQueryString } from "../utils/parse-query-string";
import {
    getRandomVerseWithOptions,
    getRandomChapterWithOptions,
    getVerseOfTheDayWithOptions,
    getChapterOfTheDayWithOptions
} from "../utils/random-content";
import {
    getVersesByChapter,
    getVerse,
    getVersesInRange,
    getMultipleVerses,
    runSearch,
    processQueryResult
} from "../utils/query-processing";

export default function route(): WRoute {
    return {
        url: "/:query?",
        method: "GET",
        handler: async (req, res) => {
            const query = parseQueryString(req.query, req.params);
            if (!query) return res.code(400).send({ error: "A valid query is required" });

            const parsedRequest = parseQuranQuery(query, req.query);
            const { type, parsed_query, parsed_options } = parsedRequest;

            let result: WResult = {
                message: "",
                request: parsedRequest,
                response: {
                    data: [],
                },
            };

            if (type === "chapter") {
                result.response.data = processQueryResult(getVersesByChapter(parsed_query.chapter), parsed_options);
            } else if (type === "verse") {
                result.response.data = processQueryResult(getVerse(parsed_query.chapter, parsed_query.verse), parsed_options);
            } else if (type === "verse_range") {
                result.response.data = processQueryResult(getVersesInRange(parsed_query.chapter, parsed_query.verse, parsed_query.verse_end), parsed_options);
            } else if (type === "multiple_verses") {
                result.response.data = processQueryResult(getMultipleVerses(parsed_query, parsed_options.sort_results === true), parsed_options);
            } else if (type === "search") {
                const queryText = parsed_query;

                if (queryText.length <= 2) return res.code(400).send({ error: "Query must be at least 3 characters" });

                if (queryText === "random-verse") {
                    result.response.data = getRandomVerseWithOptions(parsed_options);
                } else if (queryText === "random-chapter") {
                    result.response.data = getRandomChapterWithOptions(parsed_options);
                } else if (queryText === "verse-of-the-day") {
                    result.response.data = await getVerseOfTheDayWithOptions(parsed_options);
                } else if (queryText === "chapter-of-the-day") {
                    result.response.data = await getChapterOfTheDayWithOptions(parsed_options);
                } else if (queryText.startsWith("root:") && queryText.length > 5) {
                    const root = queryText.split(":")[1];
                    const encodedRoot = encodeURIComponent(root);
                    res.code(302).redirect(`/verses-with-root/${encodedRoot}`);
                } else if (queryText.startsWith("recitations:") && queryText.length > 12) {
                    const recitations = queryText.split(":")[1];
                    const encodedRecitations = encodeURIComponent(recitations);
                    res.code(302).redirect(`/recitations/${encodedRecitations}`);
                } else if (queryText.startsWith("data:") && queryText.length > 5) {
                    const data = queryText.split(":")[1];
                    const encodedData = encodeURIComponent(data);
                    res.code(302).redirect(`/data/${encodedData}`);
                } else {
                    result.response.data = processQueryResult(runSearch(queryText, parsed_options), parsed_options, queryText);
                }
            }

            result.message = result.response.data.length
                ? `Found ${result.response.data.length} verse${result.response.data.length > 1 ? "s" : ""} with '${parsedRequest.raw_query}'`
                : `No verses found with '${parsedRequest.raw_query}'`;

            res.code(200).send({
                ...result,
                request: {
                    ...result.request,
                    type: query === "random-verse" ? "verse" :
                        query === "random-chapter" ? "chapter" : type,
                }
            });
        },
    };
}

