import { WResult } from "../types/w-result";

export function parseQuranQuery(query: string, queryParams: Record<string, string> = {}): WResult["request"] {
    // Remove any extra whitespace and convert to lowercase for easier parsing
    query = query.toLowerCase().trim();

    // Parse and validate universal options from query parameters
    const baseOptions = {
        sort_results: queryParams.sort_results === "true",
        normalize_god_casing: queryParams.normalize_god_casing === "true",
        include_word_by_word: queryParams.include_word_by_word === "true",
    };

    // Try to match chapter only (e.g., "1")
    const chapterOnlyMatch = query.match(/^(\d+)$/);
    if (chapterOnlyMatch) {
        const chapter = parseInt(chapterOnlyMatch[1], 10);
        return {
            type: "chapter",
            parsed_query: { chapter },
            parsed_options: baseOptions,
            standard_url: `/?chapter=${chapter}`
        };
    }

    // Try to match verse (e.g., "1:1")
    const verseMatch = query.match(/^(\d+)[:\s]+(\d+)$/);
    if (verseMatch) {
        const chapter = parseInt(verseMatch[1], 10);
        const verse = parseInt(verseMatch[2], 10);
        return {
            type: "verse",
            parsed_query: { chapter, verse },
            parsed_options: baseOptions,
            standard_url: `/?chapter=${chapter}&verse=${verse}`
        };
    }

    // Try to match verse range (e.g., "1:1-5")
    const verseRangeMatch = query.match(/^(\d+)[:\s]+(\d+)[-\s]+(\d+)$/);
    if (verseRangeMatch) {
        const chapter = parseInt(verseRangeMatch[1], 10);
        const verse = parseInt(verseRangeMatch[2], 10);
        const verseEnd = parseInt(verseRangeMatch[3], 10);
        return {
            type: "verse_range",
            parsed_query: { chapter, verse, verse_end: verseEnd },
            parsed_options: baseOptions,
            standard_url: `/?chapter=${chapter}&verse=${verse}&verse_end=${verseEnd}`
        };
    }

    // Try to match multiple verses (e.g., "1:1,1:2,2:1-5")
    const multipleVersesMatch = query.match(/^(?:\d+:\d+(?:-\d+)?\s*,\s*)*\d+:\d+(?:-\d+)?$/);
    if (multipleVersesMatch) {
        const verses = query.split(",").map(v => v.trim());
        const parsedVerses = verses.map(v => {
            const parts = v.split(":");
            if (parts.length !== 2) throw new Error(`Invalid verse format: ${v}`);
            
            const chapter = parseInt(parts[0], 10);
            const versePart = parts[1];
            
            if (isNaN(chapter)) throw new Error(`Invalid chapter number: ${parts[0]}`);
            
            if (versePart.includes("-")) {
                const [verse, verseEnd] = versePart.split("-").map(n => parseInt(n, 10));
                if (isNaN(verse) || isNaN(verseEnd)) throw new Error(`Invalid verse range: ${versePart}`);
                return { chapter, verse, verse_end: verseEnd };
            } else {
                const verse = parseInt(versePart, 10);
                if (isNaN(verse)) throw new Error(`Invalid verse number: ${versePart}`);
                return { chapter, verse };
            }
        });

        return {
            type: "multiple_verses",
            parsed_query: parsedVerses,
            parsed_options: baseOptions,
            standard_url: `/?multiple_verses=${verses.join(",")}`
        };
    }

    // If no specific format is matched, treat as search query
    // Parse and validate search-specific options from query parameters
    const validSearchType: "exact" | "fuzzy" = queryParams.search_strategy === "exact" || queryParams.search_strategy === "fuzzy" 
        ? queryParams.search_strategy as "exact" | "fuzzy"
        : "fuzzy";
    
    const searchOptions = {
        ...baseOptions,
        search_strategy: validSearchType,
        search_language: queryParams.search_language || "en",
        search_case_sensitive: queryParams.search_case_sensitive === "true",
        search_ignore_commentary: queryParams.search_ignore_commentary === "true",
        search_apply_highlight: queryParams.search_apply_highlight === "true",
    };

    return {
        type: "search",
        parsed_query: query,
        parsed_options: searchOptions,
        standard_url: `/?q=${encodeURIComponent(query)}`
    };
} 