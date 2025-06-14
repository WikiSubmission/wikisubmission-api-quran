import { QuranForeign } from "../data/data-quran-foreign";
import { Database } from "../types/generated/database.types";

export class dynamicPropertyAccess {
  private static resolveValue<T extends object>(
    source: T,
    key: string,
    fallback?: string | null
  ): string | null {
    return key in source ? String((source as any)[key]) : fallback ?? null;
  }

  static title(
    data: Database["public"]["Tables"]["ws-quran"]["Row"] | Database["public"]["Tables"]["ws-quran-foreign"]["Row"],
    language: string,
  ): string {
    const foreignReference = QuranForeign.data.find(f => f.verse_id === data.verse_id);
    const key = `chapter_title_${language}`;

    return (
      this.resolveValue(foreignReference ?? {}, key) ??
      this.resolveValue(data, key) ??
      (data as Database["public"]["Tables"]["ws-quran"]["Row"]).chapter_title_english
    );
  }

  static text(
    data: Database["public"]["Tables"]["DataQuran"]["Row"],
    language: string,
  ): string {
    return (
      this.resolveValue(data, `verse_text_${language}`) ??
      data.verse_text_english
    );
  }

  static subtitle(
    data: Database["public"]["Tables"]["DataQuran"]["Row"],
    language: string,
  ): string | null {
    return (
      this.resolveValue(data, `verse_subtitle_${language}`) ??
      data.verse_subtitle_english
    );
  }

  static footnote(
    data: Database["public"]["Tables"]["DataQuran"]["Row"],
    language: string,
  ): string | null {
    return (
      this.resolveValue(data, `verse_footnote_${language}`) ??
      data.verse_footnote_english
    );
  }
}