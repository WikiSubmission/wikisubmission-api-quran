import { dynamicPropertyAccess } from "./dynamic-property-access";

export function searchStrategy(verse: any, queryText: string, options: any): boolean {
    const language = options.search_language || "en";
    const ignoreCommentary = options.search_ignore_commentary === true;
    const exactPhrase = options.search_strategy === "exact";
    
    const query = queryText.toLowerCase().trim();
    if (!query) return false;
    
    // Get verse text
    const verseText = dynamicPropertyAccess.text(verse, language)?.toLowerCase() || "";
    
    // Check verse text match
    const verseMatches = exactPhrase
        ? verseText.includes(query)
        : query.split(" ").filter(word => word.trim()).every(word => verseText.includes(word.trim()));
    
    // If verse matches or we're ignoring commentary, return result
    if (verseMatches || ignoreCommentary) {
        return verseMatches;
    }
    
    // Check commentary (subtitles & footnotes)
    const subtitle = dynamicPropertyAccess.subtitle(verse, language)?.toLowerCase() || "";
    const footnote = dynamicPropertyAccess.footnote(verse, language)?.toLowerCase() || "";
    
    // Combine all commentary text
    const commentaryText = (subtitle + " " + footnote).trim();
    if (!commentaryText) return false;
    
    // Check commentary match using same logic as verse text
    const commentaryMatches = exactPhrase
        ? commentaryText.includes(query)
        : query.split(" ").filter(word => word.trim()).every(word => commentaryText.includes(word.trim()));
    
    return commentaryMatches;
}