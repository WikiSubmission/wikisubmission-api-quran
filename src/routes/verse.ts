import { WRoute } from "../types/w-route";
import { WResult } from "../types/w-result";
import { Quran } from "../data/data-quran";
import { QuranWordByWord } from "../data/data-quran-word-by-word";
import { parseQuranQuery } from "../utils/parse-quran-query";
import { parseQueryString } from "../utils/parse-query-string";
import { highlightQuery } from "../utils/highlight-query";
import { searchStrategy } from "../utils/search-strategy";
import { dynamicPropertyAccess } from "../utils/dynamic-property-access";
import fill from "fill-range";

export default function route(): WRoute {
    return {
        url: "/:query?",
        method: "GET",
        handler: async (req, res) => {
            /**
             * User must pass a valid query (either ?q={...} or /{...}).
             */
            const query = parseQueryString(req.query, req.params);

            if (!query) {
                res.code(400).send({ error: "A valid query is required" });
                return;
            }

            /**
             * Parse the query.
             * @returns {QuranRequestTypes}
             */
            const parsedRequest = parseQuranQuery(query, req.query);

            /**
             * Initialize result object.
             */
            var baseResult: WResult = {
                message: "",
                request: parsedRequest,
                response: {
                    data: [],
                    copyright: {
                        text: "Copyright © Rashad Khalifa, Ph.D.",
                        url: "https://www.masjidtucson.org/submission/faq/rashad_khalifa_summary.html",
                    },
                },
            };

            /**
             * Detected chapter request.
             * e.g. /1
             */
            if (baseResult.request.type === "chapter") {
                const chapter = baseResult.request.parsed_query.chapter;
                baseResult.response.data = Quran.data.filter(verse => verse.chapter_number === chapter).sort((a, b) => a.verse_index - b.verse_index);
            }

            /**
             * Detected verse request.
             * e.g. /1:1
             */
            if (baseResult.request.type === "verse") {
                const chapter = baseResult.request.parsed_query.chapter;
                const verse = baseResult.request.parsed_query.verse;
                baseResult.response.data = Quran.data.filter(v =>
                    v.chapter_number === chapter && v.verse_number === verse
                ).sort((a, b) => a.verse_index - b.verse_index);
            }

            /**
             * Detected verse range request.
             * e.g. /1:1-1:3
             */
            if (baseResult.request.type === "verse_range") {
                const chapter = baseResult.request.parsed_query.chapter;
                const verse = baseResult.request.parsed_query.verse;
                const verse_end = baseResult.request.parsed_query.verse_end;
                const verseNumbers = fill(verse, verse_end);
                baseResult.response.data = Quran.data.filter(v =>
                    v.chapter_number === chapter && verseNumbers.includes(v.verse_number)
                ).sort((a, b) => a.verse_index - b.verse_index);
            }

            /**
             * Detected search request.
             * e.g. /angels
             */
            if (baseResult.request.type === "search") {
                const queryText = baseResult.request.parsed_query;
                const options = baseResult.request.parsed_options;

                if (queryText.length <= 2) {
                    res.code(400).send({ error: "Query must be at least 3 characters" });
                    return;
                }

                if (queryText === "random-verse") {
                    baseResult.response.data = [Quran.data[Math.floor(Math.random() * Quran.data.length)]];
                }

                else if (queryText === "random-chapter") {
                    const randomChapterInt = Math.floor(Math.random() * (114 - 1 + 1) + 1);

                    baseResult.response.data =
                        Quran.data.length > 0
                            ? Quran.data.filter((i) => i.chapter_number === randomChapterInt)
                            : [];

                    baseResult.response.data = baseResult.response.data.sort((a, b) => a.verse_index - b.verse_index);
                }

                else if (options.search_strategy === "exact") {
                    // Exact phrase search
                    baseResult.response.data = Quran.data.filter(verse =>
                        searchStrategy(verse, queryText, options)
                    ).sort((a, b) => a.verse_index - b.verse_index);
                } else {
                    // Default search - all words must be present (order doesn't matter)
                    baseResult.response.data = Quran.data.filter(verse =>
                        searchStrategy(verse, queryText, options)
                    ).sort((a, b) => a.verse_index - b.verse_index);
                }

                // Apply highlighting if requested
                if (options.search_apply_highlight) {
                    const language = options.search_language || "en";
                    baseResult.response.data = baseResult.response.data.map(verse => {
                        const highlightedVerse = { ...verse };

                        // Highlight verse text
                        const verseText = dynamicPropertyAccess.text(verse, language);
                        const highlightedText = highlightQuery(queryText, verseText, "markdown");
                        if (highlightedText) {
                            const textField = language === "en" ? "verse_text_english" : `verse_text_${language}`;
                            highlightedVerse[textField] = highlightedText;
                        }

                        // Highlight subtitle if not ignoring commentary
                        if (!options.search_ignore_commentary) {
                            const subtitle = dynamicPropertyAccess.subtitle(verse, language);
                            const highlightedSubtitle = highlightQuery(queryText, subtitle, "markdown");
                            if (highlightedSubtitle) {
                                const subtitleField = language === "en" ? "verse_subtitle_english" : `verse_subtitle_${language}`;
                                highlightedVerse[subtitleField] = highlightedSubtitle;
                            }

                            // Highlight footnote if not ignoring commentary
                            const footnote = dynamicPropertyAccess.footnote(verse, language);
                            const highlightedFootnote = highlightQuery(queryText, footnote, "markdown");
                            if (highlightedFootnote) {
                                const footnoteField = language === "en" ? "verse_footnote_english" : `verse_footnote_${language}`;
                                highlightedVerse[footnoteField] = highlightedFootnote;
                            }
                        }

                        return highlightedVerse;
                    });
                }
            }

            /**
             * Detected multiple verses request.
             * e.g. /1:1,1:3,2:1-5
             */
            if (baseResult.request.type === "multiple_verses") {
                const verses = baseResult.request.parsed_query;
                const allVerses: Array<{ chapter: number; verse: number; originalIndex: number }> = [];

                for (let i = 0; i < verses.length; i++) {
                    const verse = verses[i];
                    if (verse.verse_end) {
                        // For verse ranges, create individual chapter-verse pairs
                        for (let v = verse.verse; v <= verse.verse_end; v++) {
                            allVerses.push({ chapter: verse.chapter, verse: v, originalIndex: i });
                        }
                    } else {
                        allVerses.push({ chapter: verse.chapter, verse: verse.verse, originalIndex: i });
                    }
                }

                // Get matching verses and preserve original query order
                const matchedVerses = allVerses.map(target => {
                    const foundVerse = Quran.data.find(v =>
                        v.chapter_number === target.chapter && v.verse_number === target.verse
                    );
                    return foundVerse ? { ...foundVerse, originalIndex: target.originalIndex } : null;
                }).filter(v => v !== null);

                // Sort by original query order if sort_results is false, otherwise let the universal sorting handle it
                if (baseResult.request.parsed_options.sort_results !== true) {
                    matchedVerses.sort((a, b) => a.originalIndex - b.originalIndex);
                }

                // Remove the temporary originalIndex property
                baseResult.response.data = matchedVerses.map(({ originalIndex, ...verse }) => verse);
            }

            /**
             * [Apply global options]
             */

            // Append word-by-word data `include_word_by_word` === "true"
            if (baseResult.request.parsed_options.include_word_by_word) {
                baseResult.response.data = baseResult.response.data.map(verse => {
                    const wordByWordData = QuranWordByWord.data.filter(word =>
                        word.verse_id === verse.verse_id
                    );

                    return {
                        ...verse,
                        word_by_word: wordByWordData
                    };
                });
            }

            // Sort mixed verse results if `sort_results` === "true"
            if (baseResult.request.parsed_options.sort_results === true) {
                baseResult.response.data.sort((a, b) => a.verse_index - b.verse_index);
            }

            /**
             * Construct status message.
             */
            baseResult.message = baseResult.response.data.length > 0
                ? `Found ${baseResult.response.data.length} verse${baseResult.response.data.length !== 1 ? "s" : ""} with '${parsedRequest.raw_query}'`
                : `No verses found with '${parsedRequest.raw_query}'`;

            /**
             * Send response.
             */
            res.code(200).send({
                ...baseResult,
                request: {
                    ...baseResult.request,
                    type: query === "random-verse" ? "verse" : query === "random-chapter" ? "chapter" : baseResult.request.type,
                }
            });
        },
    };
}
