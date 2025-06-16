import { WRoute } from "../types/w-route";
import { WResult } from "../types/w-result";
import { Quran } from "../data/data-quran";
import { QuranWordByWord } from "../data/data-quran-word-by-word";
import { QuranForeign } from "../data/data-quran-foreign";
import { parseQuranQuery } from "../utils/parse-quran-query";
import { parseQueryString } from "../utils/parse-query-string";
import { highlightQuery } from "../utils/highlight-query";
import { searchStrategy } from "../utils/search-strategy";
import { dynamicPropertyAccess } from "../utils/dynamic-property-access";
import { resolveLanguage } from "../utils/resolve-language";
import fill from "fill-range";

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
                    copyright: {
                        text: "© Rashad Khalifa, Ph.D.",
                        url: "https://www.masjidtucson.org/submission/faq/rashad_khalifa_summary.html",
                    },
                },
            };

            if (type === "chapter") {
                result.response.data = getVersesByChapter(parsed_query.chapter);
            } else if (type === "verse") {
                result.response.data = getVerse(parsed_query.chapter, parsed_query.verse);
            } else if (type === "verse_range") {
                result.response.data = getVersesInRange(parsed_query.chapter, parsed_query.verse, parsed_query.verse_end);
            } else if (type === "multiple_verses") {
                result.response.data = getMultipleVerses(parsed_query, parsed_options.sort_results === true);
            } else if (type === "search") {
                const queryText = parsed_query;

                if (queryText.length <= 2) return res.code(400).send({ error: "Query must be at least 3 characters" });

                if (queryText === "random-verse") {
                    result.response.data = getRandomVerse();
                } else if (queryText === "random-chapter") {
                    result.response.data = getRandomChapter();
                } else {
                    result.response.data = runSearch(queryText, parsed_options);
                    if (parsed_options.search_apply_highlight) {
                        result.response.data = applyHighlights(result.response.data, queryText, parsed_options);
                    }
                }
            }

            if (parsed_options.include_word_by_word) {
                result.response.data = addWordByWord(result.response.data);
            }

            if (parsed_options.include_language) {
                result.response.data = addForeignLanguageData(result.response.data, parsed_options.include_language);
            }

            if (parsed_options.sort_results === true) {
                result.response.data.sort((a, b) => a.verse_index - b.verse_index);
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

function getVersesByChapter(chapter: number) {
    return Quran.data.filter(v => v.chapter_number === chapter).sort((a, b) => a.verse_index - b.verse_index);
}

function getVerse(chapter: number, verse: number) {
    return Quran.data.filter(v => v.chapter_number === chapter && v.verse_number === verse);
}

function getVersesInRange(chapter: number, start: number, end: number) {
    const verseNumbers = fill(start, end);
    return Quran.data.filter(v => v.chapter_number === chapter && verseNumbers.includes(v.verse_number));
}

function getMultipleVerses(verses: any[], sort: boolean) {
    const all = verses.flatMap(({ chapter, verse, verse_end }, i) => {
        return verse_end
            ? Array.from({ length: verse_end - verse + 1 }, (_, idx) => ({
                chapter,
                verse: verse + idx,
                originalIndex: i,
            }))
            : [{ chapter, verse, originalIndex: i }];
    });

    let matched = all.map(({ chapter, verse, originalIndex }) => {
        const match = Quran.data.find(v => v.chapter_number === chapter && v.verse_number === verse);
        return match ? { ...match, originalIndex } : null;
    }).filter(Boolean) as any[];

    if (!sort) matched.sort((a, b) => a.originalIndex - b.originalIndex);
    return matched.map(({ originalIndex, ...v }) => v);
}

function getRandomChapter() {
    const chapter = Math.floor(Math.random() * 114) + 1;
    return getVersesByChapter(chapter);
}

function getRandomVerse() {
    const idx = Math.floor(Math.random() * Quran.data.length);
    return [Quran.data[idx]];
}

function runSearch(queryText: string, options: any) {
    return Quran.data.filter(v => searchStrategy(v, queryText, options));
}

function applyHighlights(verses: any[], queryText: string, options: any) {
    const lang = resolveLanguage(options.search_language || "en");

    return verses.map(verse => {
        const copy = { ...verse };

        const verseText = dynamicPropertyAccess.text(verse, lang);
        const highlightedText = highlightQuery(queryText, verseText, "markdown");
        if (highlightedText) {
            const textField = lang === "english" ? "verse_text_english" : `verse_text_${lang}`;
            copy[textField] = highlightedText;
        }

        if (!options.search_ignore_commentary) {
            const subtitle = dynamicPropertyAccess.subtitle(verse, lang);
            const footnote = dynamicPropertyAccess.footnote(verse, lang);

            const hSubtitle = highlightQuery(queryText, subtitle, "markdown");
            const hFootnote = highlightQuery(queryText, footnote, "markdown");

            if (hSubtitle) {
                const subtitleField = lang === "english" ? "verse_subtitle_english" : `verse_subtitle_${lang}`;
                copy[subtitleField] = hSubtitle;
            }

            if (hFootnote) {
                const footnoteField = lang === "english" ? "verse_footnote_english" : `verse_footnote_${lang}`;
                copy[footnoteField] = hFootnote;
            }
        }

        return copy;
    });
}

function addWordByWord(data: any[]) {
    return data.map(verse => ({
        ...verse,
        word_by_word: QuranWordByWord.data.filter(w => w.verse_id === verse.verse_id),
    }));
}

function addForeignLanguageData(data: any[], language: string) {
    const resolvedLanguage = resolveLanguage(language);

    return data.map(verse => {
        const foreignData = QuranForeign.data.find(f => f.verse_id === verse.verse_id);
        if (!foreignData) return verse;

        const languageFields = {
            text: `verse_text_${resolvedLanguage}`,
            subtitle: `verse_subtitle_${resolvedLanguage}`,
            footnote: `verse_footnote_${resolvedLanguage}`,
            chapter_title: `chapter_title_${resolvedLanguage}`
        };

        const enhancedVerse = { ...verse };

        // Append all fields, falling back to English if needed
        enhancedVerse[languageFields.text] =
            foreignData[languageFields.text as keyof typeof foreignData] ?? verse.verse_text_english;

        enhancedVerse[languageFields.subtitle] =
            foreignData[languageFields.subtitle as keyof typeof foreignData] ?? verse.verse_subtitle_english ?? null;

        enhancedVerse[languageFields.footnote] =
            foreignData[languageFields.footnote as keyof typeof foreignData] ?? verse.verse_footnote_english ?? null;

        enhancedVerse[languageFields.chapter_title] =
            foreignData[languageFields.chapter_title as keyof typeof foreignData] ?? verse.chapter_title_english;

        return enhancedVerse;
    });
}