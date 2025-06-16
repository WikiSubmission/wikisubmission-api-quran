import { WData } from ".";
import { Database } from "../types/generated/database.types";

export const QuranForeign = new WData<
  Database["public"]["Tables"]["ws-quran-foreign"]["Row"][]
>("ws-quran-foreign", {
  numericalSortKey: "global_index"
});