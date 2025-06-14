export function highlightQuery(
  query: string,
  reference: string | undefined | null,
  method?: "markdown" | "html",
): string | null {
  if (!reference) return null;

  const escapedHighlight = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `\\b(${escapedHighlight.replace(/\s+/g, "|")})\\b|(?<=\\b)(${escapedHighlight})`,
    "gi",
  );
  const highlightMethod = method ? method : "markdown";

  return reference
    .replace(
      /(?<!\*)\*{1,2}(?!\*)/g,
      highlightMethod === "markdown" ? "±" : "*",
    )
    .replace(
      regex,
      highlightMethod === "html"
        ? `<span class="text-red-800"><b>$&</b></span>`
        : `**$&**`,
    );
}
