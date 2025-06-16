import {
  createClient,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import { Database } from "../types/generated/database.types";
import { Server } from "../server";
import Bottleneck from "bottleneck";
import NodeCache from "node-cache";
import { getSupabaseClient } from "../utils/get-supabase-client";

export class WData<T> {
  supabaseClient: SupabaseClient | null = null;
  data: T | [] = [];
  cache = new NodeCache();

  static rateLimiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 5000,
  });

  constructor(
    public table: keyof Database["public"]["Tables"],
    public opts?: {
      numericalSortKey?: string;
      alphabeticallySortKeys?: boolean;
      gracefullyRefreshOnChanges?: {
        minutesBeforeResync: number;
      };
      finalAdjustments?: (data: T | []) => Promise<T>;
    },
  ) { }

  async initialize(): Promise<void> {
    await this.setDataFromLocalFiles();
    await this.makeFinalAdjustments();
    // Fetch data from Supabase in the background
    if (process.env.USE_LOCAL_DATA !== "true") {
      WData.rateLimiter.schedule(async () => {
        await this.setDataFromSupabaseInBackground();
        await this.makeFinalAdjustments();
      });
    }
  }

  async makeFinalAdjustments() {
    if (this.opts?.finalAdjustments) {
      const newData = await this.opts.finalAdjustments(this.data);
      this.setData(newData);
    }
    if (!this.data) {
      // Fall back to local version in case an update voids/corrupts the data.
      Server.instance.log(`>   "${this.table}" no data found, falling back to local version.`);
      this.setDataFromLocalFiles();
    }
  }

  private async setDataFromLocalFiles() {
    const data = require(`../../src/_localdata/${this.table}.json`);
    if (data) {
      Server.instance.log(`Loaded local data for table: ${this.table}`);
      this.setData(data as T);
    }
  }

  private async setDataFromSupabaseInBackground() {
    try {
      this.supabaseClient = getSupabaseClient();
      Server.instance.log(`Starting fetch for ${this.table}`);
      const startTimestamp = Date.now();
      const request = await this.supabaseClient.from(this.table).select("*");
      if (request.status === 200 && request.data) {
        this.setData(request.data as T);
        Server.instance.log(
          `${this.table} Fetched! (${Date.now() - startTimestamp}ms)`,
        );

        if (this.opts?.gracefullyRefreshOnChanges) {
          this.gracefullyRefreshOnChanges(
            this.opts.gracefullyRefreshOnChanges.minutesBeforeResync,
          );
        }
      } else {
        Server.instance.error(
          `Error fetching data for "${this.table}": ${request.error?.message || "--"
          }`, true,
        );
        console.error(request);
      }
    } catch (error: any) {
      Server.instance.error(
        `Error fetching data for "${this.table}": ${error?.message || "--"}`, true
      );
      console.error(error);
    }
  }

  private setData(data: T) {
    this.data = data;
    this.handleSorting();
  }

  private handleSorting(): void {
    const { numericalSortKey, alphabeticallySortKeys } = this.opts || {};

    if (!Array.isArray(this.data)) {
      return;
    }

    // Check if numericalSortKey exists and sort by that key if it does
    if (numericalSortKey) {
      this.data.sort((a: any, b: any) => {
        const valueA = a[numericalSortKey];
        const valueB = b[numericalSortKey];

        // Handle undefined or invalid values gracefully
        if (valueA === undefined || valueB === undefined) {
          throw new Error(
            `Property "${numericalSortKey}" is missing in some data items.`,
          );
        }

        return Number(valueA) - Number(valueB);
      });
    }

    // Sort keys alphabetically if the option is set
    if (alphabeticallySortKeys) {
      this.data = this.data.map((item) => sortKeysAlphabetically(item)) as T;
    }

    function sortKeysAlphabetically<T extends object>(obj: T): T {
      const sortedKeys = Object.keys(obj).sort();
      const sortedObj: Record<string, unknown> = {};
      sortedKeys.forEach((key) => {
        sortedObj[key] = obj[key as keyof typeof obj];
      });
      return sortedObj as T; // Return a new object with sorted keys
    }
  }

  // Subscribe to changes and handle them
  async gracefullyRefreshOnChanges(
    gracePeriodInMinutes?: number,
  ): Promise<void> {
    this.subscribeToDataChanges(async (change) => {
      const syncAlreadyScheduledKey = `SyncScheduled:${this.table}`;
      const syncAlreadyScheduled =
        this.cache.get(syncAlreadyScheduledKey) === true;

      if (!syncAlreadyScheduled) {
        this.cache.set(syncAlreadyScheduledKey, true);
        Server.instance.log(
          `>   "${this.table}" will be re-synced in ${gracePeriodInMinutes || 1
          } min ("${change.eventType}" detected)...`,
        );

        setTimeout(
          async () => {
            await this.initialize();
            this.cache.set(syncAlreadyScheduledKey, false);
            Server.instance.log(`>   "${this.table}" resync complete.`);
          },
          (gracePeriodInMinutes || 1) * 60 * 1000,
        );
      }
    });
  }

  // Subscribe to data changes helper
  private async subscribeToDataChanges(
    onChange: (
      payload: RealtimePostgresChangesPayload<{ [key: string]: T }>,
    ) => Promise<void>,
  ): Promise<void> {
    if (!this.supabaseClient) return;
    this.supabaseClient
      .channel(`changes:${this.table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: this.table,
        },
        async (payload) => {
          await onChange(payload);
        },
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          Server.instance.log(`>   "${this.table}" auto sync ON`);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`>   "${this.table}" auto sync RECONNECTING...`);
          await this.subscribeToDataChanges(onChange);
        }
      });
  }
}
