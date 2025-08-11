import { Quran } from "../data/data-quran";
import { QuranWordByWord } from "../data/data-quran-word-by-word";
import { QuranForeign } from "../data/data-quran-foreign";
import { highlightQuery } from "./highlight-query";
import { dynamicPropertyAccess } from "./dynamic-property-access";
import { resolveLanguage } from "./resolve-language";
import { searchStrategy } from "./search-strategy";
import fill from "fill-range";

/**
 * Handles text processing operations for Quran verses
 */
class TextProcessor {
    /**
     * Processes text by applying asterisk replacement and optional query highlighting
     */
    static processText(text: string | null | undefined, query: string = "", method: "markdown" | "html" = "markdown"): string | null {
        if (!text) return null;
        return highlightQuery(query, text, method);
    }

    /**
     * Processes a text field with fallback to English
     */
    static processTextField(foreignText: string | null | undefined, englishFallback: string | null, query: string = ""): string | null {
        if (!foreignText) return englishFallback;
        return this.processText(foreignText, query) || foreignText;
    }

    /**
     * Gets the appropriate field name for a language
     */
    static getLanguageField(field: string, language: string): string {
        return `${field}_${language}`;
    }
}

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

        // Always process verse text to replace asterisks
        const verseText = dynamicPropertyAccess.text(verse, lang);
        const highlightedText = TextProcessor.processText(verseText, queryText, "markdown");
        const textField = lang === "english" ? "verse_text_english" : `verse_text_${lang}`;
        copy[textField] = highlightedText || verseText;

        // Process commentary if not ignored
        if (!options.search_ignore_commentary) {
            const subtitle = dynamicPropertyAccess.subtitle(verse, lang);
            const footnote = dynamicPropertyAccess.footnote(verse, lang);

            const hSubtitle = TextProcessor.processText(subtitle, queryText, "markdown");
            const hFootnote = TextProcessor.processText(footnote, queryText, "markdown");

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

            // Define the fields to process
            const fields = ['verse_text', 'verse_subtitle', 'verse_footnote', 'chapter_title'];

            fields.forEach(field => {
                const fieldName = TextProcessor.getLanguageField(field, resolvedLanguage);
                const englishField = field === 'chapter_title' ? 'chapter_title_english' : `${field}_english`;

                if (field === 'chapter_title') {
                    // Chapter titles don't need asterisk replacement
                    enhancedVerse[fieldName] = foreignData[fieldName as keyof typeof foreignData] ?? verse[englishField];
                } else {
                    // Text fields need asterisk replacement
                    enhancedVerse[fieldName] = TextProcessor.processTextField(
                        foreignData[fieldName as keyof typeof foreignData],
                        verse[englishField]
                    );
                }
            });
        });

        return enhancedVerse;
    });
}



export function processQueryResult(data: any[], options: any, queryText?: string) {
    let processedData = [...data];

    // Apply highlights if needed
    if (options.search_apply_highlight) {
        processedData = applyHighlights(processedData, queryText || "", options);
    }

    // Add word-by-word data if requested
    if (options.include_word_by_word) {
        processedData = addWordByWord(processedData);
    }

    // Add foreign language data if requested
    if (options.include_language) {
        processedData = addForeignLanguageData(processedData, options.include_language);
    }

    // Normalize God casing if requested
    if (options.normalize_god_casing === true) {
        processedData = processedData.map(verse => {
            const copy = { ...verse };
            if (copy.verse_text_english) {
                copy.verse_text_english = copy.verse_text_english.replace(/GOD/g, 'God');
            }
            return copy;
        });
    }

    // Sort results if requested
    if (options.sort_results === true) {
        processedData.sort((a, b) => a.verse_index - b.verse_index);
    }

    return processedData;
} 