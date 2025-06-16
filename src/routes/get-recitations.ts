import { Quran } from "../data/data-quran";
import { WRoute } from "../types/w-route";

export default function route(): WRoute {
    return {
        url: "/recitations/:verse_id",
        method: "GET",
        handler: async (req, res) => {
            const { verse_id } = req.params as { verse_id: string };

            const resolvedVerse = Quran.data.find(v => v.verse_id === verse_id);
            if (!resolvedVerse) {
                return res.status(404).send(`Verse "${verse_id}" not found`);
            }

            // Try to find audio index via traditional mapping for CDN
            const indexEntry = getTraditionalQuranIndex().find(v => v.verse_id === verse_id);

            let index: number | undefined = indexEntry?.index;

            // Fallback on verse 0
            if (!index && verse_id.split(":")[1] === "0") {
                index = 1;
            }

            if (!index) {
                return res.status(404).send(`Audio index for "${verse_id}" not found`);
            }

            const response = {
                verse_id,
                mishary: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${index}.mp3`,
                basit: `https://cdn.islamic.network/quran/audio/128/ar.basit/${index}.mp3`,
                minshawi: `https://cdn.islamic.network/quran/audio/128/ar.minshawi/${index}.mp3`,
            };

            return res.send(response);
        },
    };
}

function getTraditionalQuranIndex(): { verse_id: string; index: number }[] {
    const indexed: { verse_id: string; index: number }[] = [];
    let i = 1;

    for (const verse of Quran.data) {
        if (verse.chapter_number === 9 && verse.verse_number === 127) {
            indexed.push({ verse_id: verse.verse_id, index: i });
            indexed.push({ verse_id: "9:128", index: i + 1 });
            indexed.push({ verse_id: "9:129", index: i + 2 });
            i += 3;
        } else if (verse.verse_number >= 1) {
            indexed.push({ verse_id: verse.verse_id, index: i });
            i++;
        }
    }

    return indexed;
}