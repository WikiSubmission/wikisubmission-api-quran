import { Quran } from "../data/data-quran";
import { getSupabaseClient } from "./get-supabase-client";

export function getRandomVerse() {
    return Quran.data[Math.floor(Math.random() * Quran.data.length)];
}

export function getRandomChapter() {
    return Math.floor(Math.random() * (114 - 1 + 1) + 1);
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
        const randomVerse = getRandomVerse();
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
        const randomChapterInt = getRandomChapter();
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