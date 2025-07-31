import { Quran } from "../data/data-quran";
import { QuranWordByWord } from "../data/data-quran-word-by-word";
import { QuranForeign } from "../data/data-quran-foreign";
import { highlightQuery } from "./highlight-query";
import { dynamicPropertyAccess } from "./dynamic-property-access";
import { resolveLanguage } from "./resolve-language";
import { searchStrategy } from "./search-strategy";
import fill from "fill-range";

export function getVersesByChapter(chapter: number) {
    return Quran.data.filter(v => v.chapter_number === chapter).sort((a, b) => a.verse_index - b.verse_index);
}

export function getVerse(chapter: number, verse: number) {
    return Quran.data.filter(v => v.chapter_number === chapter && v.verse_number === verse);
}

export function getVersesInRange(chapter: number, start: number, end: number) {
    const verseNumbers = fill(start, end);
    return Quran.data.filter(v => v.chapter_number === chapter && verseNumbers.includes(v.verse_number));
}

export function getMultipleVerses(verses: any[], sort: boolean) {
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

export function runSearch(queryText: string, options: any) {
    return Quran.data.filter(v => searchStrategy(v, queryText, options));
}

export function applyHighlights(verses: any[], queryText: string, options: any) {
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

export function addWordByWord(data: any[]) {
    return data.map(verse => ({
        ...verse,
        word_by_word: QuranWordByWord.data.filter(w => w.verse_id === verse.verse_id),
    }));
}

export function addForeignLanguageData(data: any[], language: string) {
    // Split by comma and trim whitespace to handle multiple languages
    const languages = language.split(',').map(lang => lang.trim());
    
    return data.map(verse => {
        const foreignData = QuranForeign.data.find(f => f.verse_id === verse.verse_id);
        if (!foreignData) return verse;

        const enhancedVerse = { ...verse };

        // Process each language
        languages.forEach(lang => {
            const resolvedLanguage = resolveLanguage(lang);
            
            const languageFields = {
                text: `verse_text_${resolvedLanguage}`,
                subtitle: `verse_subtitle_${resolvedLanguage}`,
                footnote: `verse_footnote_${resolvedLanguage}`,
                chapter_title: `chapter_title_${resolvedLanguage}`
            };

            // Append all fields, falling back to English if needed
            enhancedVerse[languageFields.text] =
                foreignData[languageFields.text as keyof typeof foreignData] ?? verse.verse_text_english;

            enhancedVerse[languageFields.subtitle] =
                foreignData[languageFields.subtitle as keyof typeof foreignData] ?? verse.verse_subtitle_english ?? null;

            enhancedVerse[languageFields.footnote] =
                foreignData[languageFields.footnote as keyof typeof foreignData] ?? verse.verse_footnote_english ?? null;

            enhancedVerse[languageFields.chapter_title] =
                foreignData[languageFields.chapter_title as keyof typeof foreignData] ?? verse.chapter_title_english;
        });

        return enhancedVerse;
    });
}

export function processQueryResult(data: any[], options: any, queryText?: string) {
    let processedData = [...data];

    // Apply highlights if needed
    if (queryText && options.search_apply_highlight) {
        processedData = applyHighlights(processedData, queryText, options);
    }

    // Add word-by-word data if requested
    if (options.include_word_by_word) {
        processedData = addWordByWord(processedData);
    }

    // Add foreign language data if requested
    if (options.include_language) {
        processedData = addForeignLanguageData(processedData, options.include_language);
    }

    // Sort results if requested
    if (options.sort_results === true) {
        processedData.sort((a, b) => a.verse_index - b.verse_index);
    }

    return processedData;
} 