import { WData } from ".";
import { Database } from "../types/generated/database.types";

export const QuranWordByWord = new WData<
  Database["public"]["Tables"]["ws-quran-word-by-word"]["Row"][]
>("ws-quran-word-by-word", {
  numericalSortKey: "global_index"
});