import { WData } from ".";
import { Database } from "../types/generated/database.types";

export const QuranChapters = new WData<
  Database["public"]["Tables"]["ws-quran-word-by-word"]["Row"][]
>("ws-quran-chapters");