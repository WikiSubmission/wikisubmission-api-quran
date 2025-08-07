export function highlightQuery(
  query: string,
  reference: string | undefined | null,
  method?: "markdown" | "html",
): string | null {
  if (!reference) return null;

  const highlightMethod = method ? method : "markdown";
  
  // Always replace asterisks first, regardless of whether there's a match
  let processedText = reference.replace(
    /(?<!\*)\*{1,2}(?!\*)/g,
    highlightMethod === "markdown" ? "±" : "*",
  );

  // Only apply highlighting if there's a query
  if (query && query.trim()) {
    const escapedHighlight = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `\\b(${escapedHighlight.replace(/\s+/g, "|")})\\b|(?<=\\b)(${escapedHighlight})`,
      "gi",
    );

    processedText = processedText.replace(
      regex,
      highlightMethod === "html"
        ? `<span class="text-red-800"><b>$&</b></span>`
        : `**$&**`,
    );
  }

  return processedText;
}
