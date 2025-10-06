import { calculateGematria, getGematriaBreakdown } from "./gematria";
import { Languages, GodAttributesCardDataType } from "../types/God-attributes";

interface SheetRow {
  "Verse (first verse occurance)": string;
  "Order in revelation": string;
  Arabic: string;
  English: string;
  "Gematrical Value": string;
  Frequency: string;
  "Occured Verse": string;
  Turkish: string;
  French: string;
  "Gematria Test": string;
  // Add other language columns as they appear
  [key: string]: string;
}

export function convertSheetDataToGodAttributes(
  sheetData: SheetRow[],
): GodAttributesCardDataType[] {
  return sheetData
    .filter((row) => row.Arabic && row.Arabic.trim() !== "") // Filter out empty rows
    .map((row, index) => {
      const arabicText = row.Arabic.trim();
      const gematria = calculateGematria(arabicText);

      // Parse occurrences
      const occurences = parseOccurrences(row["Occured Verse"]);

      // Calculate order in revelation from verse list (using first occurrence)
      const orderInRevelation =
        occurences.length > 0
          ? calculateOrderFromFirstOccurrence(occurences[0])
          : index + 1;

      // Build text array for different languages
      const text: { text: string; language: Languages }[] = [];

      // Add Arabic (always present)
      text.push({
        text: arabicText,
        language: "ARABIC",
      });

      // Add English if present
      if (row.English && row.English.trim()) {
        text.push({
          text: row.English.trim(),
          language: "ENGLISH",
        });
      }

      // Add French if present
      if (row.French && row.French.trim()) {
        text.push({
          text: row.French.trim(),
          language: "FRENCH",
        });
      }

      // Add Turkish if present (extending our Languages type)
      if (row.Turkish && row.Turkish.trim()) {
        text.push({
          text: row.Turkish.trim(),
          language: "TURKISH" as Languages,
        });
      }

      // Check for other language columns dynamically
      Object.keys(row).forEach((key) => {
        if (isLanguageColumn(key) && row[key] && row[key].trim()) {
          const language = mapColumnToLanguage(key);
          if (language && !text.find((t) => t.language === language)) {
            text.push({
              text: row[key].trim(),
              language,
            });
          }
        }
      });

      return {
        order_in_revelation: orderInRevelation,
        text,
        gematria,
        occurences,
        gematria_breakdown: getGematriaBreakdown(arabicText),
      };
    })
    .sort((a, b) => a.order_in_revelation - b.order_in_revelation); // Sort by revelation order
}

function parseOccurrences(
  occurredVerse: string,
): { chapter_index: number; verse_index: number; word_index: number | null }[] {
  if (!occurredVerse || occurredVerse.trim() === "") return [];

  return occurredVerse
    .split(",")
    .map((verse) => verse.trim())
    .filter((verse) => {
      if (!verse) return false;
      const parts = verse.split(":");
      return parts.length >= 2;
    })
    .filter((verse) => verse !== "")
    .map((verse) => {
      const parts = verse.split(":");
      return {
        chapter_index: parseInt(parts[0]) || -1,
        verse_index: parseInt(parts[1]) || -1,
        word_index: parts[2] ? parseInt(parts[2]) : null,
      };
    });
}

// Quran structure: number of verses in each sura
const quranVerseCounts: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
  83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
  56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

function calculateOrderFromFirstOccurrence(occurrence: {
  chapter_index: number;
  verse_index: number;
}): number {
  const { chapter_index, verse_index } = occurrence;

  // validate chapter index
  if (chapter_index < 1 || chapter_index > 114) {
    return Number.MAX_SAFE_INTEGER; // fallback for invalid input
  }

  // sum verses of all previous chapters + current verse index
  const offset = quranVerseCounts
    .slice(0, chapter_index - 1)
    .reduce((a, b) => a + b, 0);

  return offset + verse_index;
}

function isLanguageColumn(columnName: string): boolean {
  const languageColumns = [
    "spanish",
    "german",
    "italian",
    "urdu",
    "hindi",
    "chinese",
  ];
  return languageColumns.some((lang) =>
    columnName.toLowerCase().includes(lang),
  );
}

function mapColumnToLanguage(columnName: string): Languages | null {
  const mapping: { [key: string]: Languages } = {
    spanish: "SPANISH",
    german: "GERMAN",
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (columnName.toLowerCase().includes(key)) {
      return value;
    }
  }
  return null;
}
