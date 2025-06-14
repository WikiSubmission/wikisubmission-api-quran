/**
 * All primary routes should return this interface.
 */

export interface WResult {
    // [A summary / status message]
    message: string;
    // [The request, parsed from the query]
    request: RequestObject;
    // [The actual response]
    response: {
        data: any[];
        copyright?: {
            text: string;
            url: string;
        };
    };
}

export type RequestObject =
    | ChapterRequest // e.g. /1
    | VerseRequest // e.g. /1:1
    | VerseRangeRequest // e.g. /1:1-1:3
    | SearchRequest // e.g. /angels
    | MultipleVersesRequest // e.g. /1:1,1:3,2:1-5
    // (?q={query} is also acceptable)

export interface ChapterRequest {
    type: "chapter";
    parsed_query: {
        chapter: number;
    };
    parsed_options: ParsedOptions;
    standard_url: string;
}

export interface VerseRequest {
    type: "verse";
    parsed_query: {
        chapter: number;
        verse: number;
    };
    parsed_options: ParsedOptions;
    standard_url: string;
}

export interface VerseRangeRequest {
    type: "verse_range";
    parsed_query: {
        chapter: number;
        verse: number;
        verse_end: number;
    };
    parsed_options: ParsedOptions;
    standard_url: string;
}

export interface SearchRequest {
    type: "search";
    parsed_query: string;
    parsed_options: ParsedOptions;
    standard_url: string;
}

export interface MultipleVersesRequest {
    type: "multiple_verses";
    parsed_query: Array<{
        chapter: number;
        verse: number;
        verse_end?: number;
    }>;
    parsed_options: ParsedOptions;
    standard_url: string;
}

export interface ParsedOptions {
    // Universal options
    sort_results: boolean;
    normalize_god_casing: boolean;
    include_word_by_word: boolean;
    // Search-specific options
    search_strategy?: "exact" | "fuzzy";
    search_language?: string;
    search_case_sensitive?: boolean;
    search_ignore_commentary?: boolean;
    search_apply_highlight?: boolean;
}