import { WRoute } from "../types/w-route";
import { Readable } from "stream";
import csv from "csv-parser";

export default function route(): WRoute {
    return {
        url: "/attributes",
        method: "GET",
        cache: {
            duration: 15,
            durationType: "seconds"
        },
        handler: async (req, res) => {
            try {
                const csvUrl = `https://docs.google.com/spreadsheets/d/1B1AVb5ZFUn3kF-jHbnn6XEwJsUUgxH7PqnpAu7vRXSg/export?format=csv&gid=0`;

                const response = await fetch(csvUrl);
                if (!response.ok) {
                    return res.status(500).send({ error: "Failed to fetch Google Sheets data" });
                }

                const csvText = await response.text();

                // Parse CSV data
                const results: any[] = [];
                const stream = Readable.from([csvText]);

                await new Promise((resolve, reject) => {
                    stream
                        .pipe(csv())
                        .on('data', (data) => results.push(data))
                        .on('end', resolve)
                        .on('error', reject);
                });

                // Map the data to the expected structure
                const formattedData = results.map((row, index) => {
                    // Skip header row (index 0) if it exists
                    if (index === 0 && Object.keys(row)[0] === 'Verse') {
                        return null;
                    }

                    return {
                        verse: row['Verse'] || row['verse'] || '',
                        order_in_revelation: parseInt(row['Order in revelation'] || row['order_in_revelation'] || '0'),
                        arabic: row['Arabic'] || row['arabic'] || '',
                        english: row['English'] || row['english'] || '',
                        gematrical_value: parseInt(row['Gematrical Value'] || row['gematrical_value'] || '0'),
                        frequency: parseInt(row['Frequency'] || row['frequency'] || '0'),
                        occurred_verse: row['Occured Verse'] || row['occurred_verse'] || '',
                        turkish: row['Turkish'] || row['turkish'] || '',
                        french: row['French'] || row['french'] || '',
                        gematria_test: row['Gematria Test'] || row['gematria_test'] || ''
                    };
                }).filter(item => item !== null); // Remove null entries

                return res.send({
                    message: `Found ${formattedData.length} attributes`,
                    data: formattedData
                });

            } catch (error) {
                console.error('Error fetching attributes:', error);
                return res.status(500).send({
                    error: "Failed to fetch attributes",
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        },
    };
}
