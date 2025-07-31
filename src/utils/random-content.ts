import { Quran } from "../data/data-quran";
import { getSupabaseClient } from "./get-supabase-client";
import { getVersesByChapter, processQueryResult } from "./query-processing";

export function getRandomVerseWithOptions(options: any) {
    const verse = Quran.data[Math.floor(Math.random() * Quran.data.length)];
    return processQueryResult([verse], options);
}

export function getRandomChapterWithOptions(options: any) {
    const chapterNumber = Math.floor(Math.random() * (114 - 1 + 1) + 1);
    const verses = getVersesByChapter(chapterNumber);
    return processQueryResult(verses, options);
}

export async function getVerseOfTheDay() {
    const db = getSupabaseClient();
    const { data, error } = await db.from("ws-verse-of-the-day")
        .select("*")
        .eq("year", new Date().getFullYear())
        .eq("month", new Date().getMonth() + 1)
        .eq("day", new Date().getDate())
        .single();

    if (error) {
        // No entry for today. Create new record.
        const randomVerse = Quran.data[Math.floor(Math.random() * Quran.data.length)];
        await db.from("ws-verse-of-the-day").insert({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            day: new Date().getDate(),
            verse_id: randomVerse.verse_id,
        });
        return randomVerse;
    } else {
        // Entry for today. Get the verse.
        return Quran.data.find(v => v.verse_id === data.verse_id) || null;
    }
}

export async function getVerseOfTheDayWithOptions(options: any) {
    const verse = await getVerseOfTheDay();
    return processQueryResult(verse ? [verse] : [], options);
}

export async function getChapterOfTheDay() {
    const db = getSupabaseClient();
    const { data, error } = await db.from("ws-chapter-of-the-day")
        .select("*")
        .eq("year", new Date().getFullYear())
        .eq("month", new Date().getMonth() + 1)
        .eq("day", new Date().getDate())
        .single();

    if (error) {
        // No entry for today. Create new record.
        const randomChapterInt = Math.floor(Math.random() * (114 - 1 + 1) + 1);
        await db.from("ws-chapter-of-the-day").insert({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            day: new Date().getDate(),
            chapter_number: randomChapterInt,
        });
        return randomChapterInt;
    } else {
        // Entry for today. Get the chapter.
        return data.chapter_number;
    }
}

export async function getChapterOfTheDayWithOptions(options: any) {
    const chapterNumber = await getChapterOfTheDay();
    const verses = getVersesByChapter(chapterNumber);
    return processQueryResult(verses, options);
} 