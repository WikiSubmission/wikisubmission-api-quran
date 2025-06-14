import dotenv from "dotenv";
import { Server } from "./server";
import { Quran } from "./data/data-quran";
import { QuranWordByWord } from "./data/data-quran-word-by-word";
import { QuranChapters } from "./data/data-quran-chapters";
import { QuranForeign } from "./data/data-quran-foreign";

(async () => {
    try {
        // [Environment]
        dotenv.config();
        Server.instance.log(
            `NODE_ENV: ${process.env.NODE_ENV || 'development (default)'}`,
        );
        if (process.env.SUPABASE_URL && process.env.SUPABASE_API_KEY) {
            Server.instance.log(`Environment variables loaded (supabase keys found)\n`);
        } else {
            Server.instance.error(
                `Missing environment variables (SUPABASE_URL, SUPABASE_API_KEY)`,
                true,
            );
        }

        // [Initialize data]
        await Quran.initialize();
        await QuranWordByWord.initialize();
        await QuranChapters.initialize();
        await QuranForeign.initialize();

        // [Start server]
        await Server.instance.start();

    } catch (error) {
        console.error(error);
    }
})();