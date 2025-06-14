import { WData } from ".";
import { Database } from "../types/generated/database.types";
import fs from "fs";
import path from "path";

export const QuranWordByWord = new WData<
  Database["public"]["Tables"]["ws-quran-word-by-word"]["Row"][]
>("ws-quran-word-by-word");