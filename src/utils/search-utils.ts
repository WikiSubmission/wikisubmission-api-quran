import { dynamicPropertyAccess } from "./dynamic-property-access";

export function searchInVerse(verse: any, queryText: string, options: any): boolean {
    const language = options.search_language || "en";
    const ignoreCommentary = options.search_ignore_commentary === true;
    const caseSensitive = options.search_case_sensitive === true;
    
    // Get text content using dynamic property access
    const verseText = dynamicPropertyAccess.text(verse, language);
    let searchableText = verseText;
    
    // Add commentary fields if not ignored
    if (!ignoreCommentary) {
        const subtitle = dynamicPropertyAccess.subtitle(verse, language) || "";
        const footnote = dynamicPropertyAccess.footnote(verse, language) || "";
        searchableText += " " + subtitle + " " + footnote;
    }
    
    // Apply case sensitivity
    const finalText = caseSensitive ? searchableText : searchableText.toLowerCase();
    const finalQuery = caseSensitive ? queryText : queryText.toLowerCase();
    
    return finalText.includes(finalQuery);
}