import { WData } from ".";
import { Database } from "../types/generated/database.types";

export const QuranChapters = new WData<
  Database["public"]["Tables"]["ws-quran-chapters"]["Row"][]
>("ws-quran-chapters", {
  numericalSortKey: "chapter_number"
});