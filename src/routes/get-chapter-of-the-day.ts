import { WRoute } from "../types/w-route";
import { getSupabaseClient } from "../utils/get-supabase-client";

export default function route(): WRoute {
    return {
        url: "/chapter-of-the-day",
        method: "GET",
        handler: async (req, res) => {
            const db = getSupabaseClient();
            const queryString = new URLSearchParams(req.query as Record<string, string>).toString();

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

                res.code(302).redirect(`/${randomChapterInt}${queryString ? `?${queryString}` : ""}`);
            } else {
                // Entry for today. Redirect to the chapter.
                res.code(302).redirect(`/${data.chapter_number}${queryString ? `?${queryString}` : ""}`);
            }
        },
    };
}