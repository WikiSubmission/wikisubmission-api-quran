import { WRoute } from "../types/w-route";
import { Readable } from "stream";
import csv from "csv-parser";
import { convertSheetDataToGodAttributes } from "../utils/sheet-converter";

export default function route(): WRoute {
  return {
    url: "/attributes",
    method: "GET",
    cache: {
      duration: 19,
      durationType: "hours",
    },
    handler: async (req, res) => {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/1B1AVb5ZFUn3kF-jHbnn6XEwJsUUgxH7PqnpAu7vRXSg/export?format=csv&gid=0`;

        const response = await fetch(csvUrl);
        if (!response.ok) {
          return res
            .status(500)
            .send({ error: "Failed to fetch Google Sheets data" });
        }

        const csvText = await response.text();

        // Parse CSV data
        const results: any[] = [];
        const stream = Readable.from([csvText]);

        await new Promise((resolve, reject) => {
          stream
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", resolve)
            .on("error", reject);
        });

        // Map the data to the expected structure
        const formattedData = convertSheetDataToGodAttributes(results);

        return res.send({
          message: `Found ${formattedData.length} attributes`,
          data: formattedData,
        });
      } catch (error) {
        console.error("Error fetching attributes:", error);
        return res.status(500).send({
          error: "Failed to fetch attributes",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  };
}
