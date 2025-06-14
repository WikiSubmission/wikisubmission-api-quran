import { WRoute } from "../types/w-route";
import { WResult } from "../types/w-result";
import { Quran } from "../data/data-quran";
import { QuranWordByWord } from "../data/data-quran-word-by-word";
import { parseQuranQuery } from "../utils/parse-quran-query";
import { searchInVerse } from "../utils/search-utils";
import { highlightQuery } from "../utils/highlight-query";
import { parseURLQuery } from "../utils/parse-url-query";
import { dynamicPropertyAccess } from "../utils/dynamic-property-access";
import fill from "fill-range";

export default function route(): WRoute {
    return {
        url: "/:query?",
        method: "GET",
        handler: async (req, res) => {
            const query = parseURLQuery(req.query, req.params);
            const queryParams = req.query as any;
            const hasDirectParams = queryParams.chapter || queryParams.verse || queryParams.verse_end || queryParams.multiple_verses || queryParams.q;

            if (!query && !hasDirectParams) {
                res.code(400).send({ error: "A valid query is required" });
                return;
            }

            const parsedRequest = parseQuranQuery(query || "", req.query);

            var result: WResult = {
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

            if (result.request.type === "chapter") {
                const chapter = result.request.parsed_query.chapter;
                result.response.data = Quran.data.filter(verse => verse.chapter_number === chapter).sort((a, b) => a.verse_index - b.verse_index);
            }

            if (result.request.type === "verse") {
                const chapter = result.request.parsed_query.chapter;
                const verse = result.request.parsed_query.verse;
                result.response.data = Quran.data.filter(v =>
                    v.chapter_number === chapter && v.verse_number === verse
                ).sort((a, b) => a.verse_index - b.verse_index);
            }

            if (result.request.type === "verse_range") {
                const chapter = result.request.parsed_query.chapter;
                const verse = result.request.parsed_query.verse;
                const verse_end = result.request.parsed_query.verse_end;
                const verseNumbers = fill(verse, verse_end);
                result.response.data = Quran.data.filter(v =>
                    v.chapter_number === chapter && verseNumbers.includes(v.verse_number)
                ).sort((a, b) => a.verse_index - b.verse_index);
            }

            if (result.request.type === "search") {
                const queryText = result.request.parsed_query;
                const options = result.request.parsed_options;

                if (queryText.length <= 2) {
                    res.code(400).send({ error: "Query must be at least 3 characters" });
                    return;
                }

                if (queryText === "random-verse") {
                    result.response.data = [Quran.data[Math.floor(Math.random() * Quran.data.length)]];
                }

                else if (queryText === "random-chapter") {
                    const randomChapterInt = Math.floor(Math.random() * (114 - 1 + 1) + 1);

                    result.response.data =
                        Quran.data.length > 0
                            ? Quran.data.filter((i) => i.chapter_number === randomChapterInt)
                            : [];
                }

                else if (options.search_strategy === "exact") {
                    // Exact phrase search
                    result.response.data = Quran.data.filter(verse =>
                        searchInVerse(verse, queryText, options)
                    ).sort((a, b) => a.verse_index - b.verse_index);
                } else {
                    // Fuzzy search - split query into words and match any
                    const searchWords = queryText.split(/\s+/).filter(word => word.length > 0);
                    result.response.data = Quran.data.filter(verse => {
                        return searchWords.some(word => searchInVerse(verse, word, options));
                    }).sort((a, b) => a.verse_index - b.verse_index);
                }

                // Apply highlighting if requested
                if (options.search_apply_highlight) {
                    const language = options.search_language || "en";
                    result.response.data = result.response.data.map(verse => {
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

            if (result.request.type === "multiple_verses") {
                const verses = result.request.parsed_query;
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
                if (result.request.parsed_options.sort_results !== true) {
                    matchedVerses.sort((a, b) => a.originalIndex - b.originalIndex);
                }

                // Remove the temporary originalIndex property
                result.response.data = matchedVerses.map(({ originalIndex, ...verse }) => verse);
            }

            // Apply word-by-word data if requested
            if (result.request.parsed_options.include_word_by_word) {
                result.response.data = result.response.data.map(verse => {
                    const wordByWordData = QuranWordByWord.data.filter(word =>
                        word.verse_id === verse.verse_id
                    );

                    return {
                        ...verse,
                        word_by_word: wordByWordData
                    };
                });
            }

            // Apply universal options
            if (result.request.parsed_options.sort_results === true) {
                result.response.data.sort((a, b) => a.verse_index - b.verse_index);
            }

            result.message = result.response.data.length > 0
                ? `Found ${result.response.data.length} verse${result.response.data.length !== 1 ? "s" : ""} with '${parsedRequest.raw_query}'`
                : `No verses found with '${parsedRequest.raw_query}'`;

            res.code(200).send({
                ...result,
                request: {
                    ...result.request,
                    type: query === "random-verse" ? "verse" : query === "random-chapter" ? "chapter" : result.request.type,
                }
            });
        },
    };
}
