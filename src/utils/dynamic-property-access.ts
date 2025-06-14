import { Database } from "../types/generated/database.types";

export class dynamicPropertyAccess {
  static title(
    data: Database["public"]["Tables"]["DataQuran"]["Row"],
    language: string,
  ): string {
    const proposedChapterKey = `chapter_title_${language}`;
    if (proposedChapterKey in data) {
      return `${data[proposedChapterKey as keyof typeof data]}`;
    } else {
      return data.chapter_title_english;
    }
  }

  static text(
    data: Database["public"]["Tables"]["DataQuran"]["Row"],
    language: string,
  ): string {
    const proposedTextKey = `verse_text_${language}`;
    if (proposedTextKey in data) {
      return `${data[proposedTextKey as keyof typeof data]}`;
    } else {
      return data.verse_text_english;
    }
  }

  static subtitle(
    data: Database["public"]["Tables"]["DataQuran"]["Row"],
    language: string,
  ): string | null {
    const proposedSubtitleKey = `verse_subtitle_${language}`;
    if (proposedSubtitleKey in data) {
      return `${data[proposedSubtitleKey as keyof typeof data]}`;
    } else {
      return data.verse_subtitle_english;
    }
  }

  static footnote(
    data: Database["public"]["Tables"]["DataQuran"]["Row"],
    language: string,
  ): string | null {
    const proposedFootnoteKey = `verse_footnote_${language}`;
    if (proposedFootnoteKey in data) {
      return `${data[proposedFootnoteKey as keyof typeof data]}`;
    } else {
      return data.verse_footnote_english;
    }
  }
}
