import { WData } from ".";
import { Database } from "../types/generated/database.types";

export const Quran = new WData<
  Database["public"]["Tables"]["ws-quran"]["Row"][]
>("ws-quran", {
  gracefullyRefreshOnChanges: {
    minutesBeforeResync: 1,
  },
  numericalSortKey: "verse_index"
});
