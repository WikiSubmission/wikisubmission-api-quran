import { Quran } from "../data/data-quran";
import { WRoute } from "../types/w-route";
import { getSupabaseClient } from "../utils/get-supabase-client";

export default function route(): WRoute {
    return {
        url: "/verse-of-the-day",
        method: "GET",
        handler: async (_, res) => {
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
                res.code(302).redirect(`/${randomVerse.verse_id}`);
            } else {
                // Entry for today. Redirect to the verse.
                res.code(302).redirect(`/${data.verse_id}`);
            }
        },
    };
}