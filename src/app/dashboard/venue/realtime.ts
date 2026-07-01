"use client";

import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

/**
 * Command payload sent to a table's Lumen Player.
 * Canonical shape — see LUMEN_HARDWARE_SPEC.md §5.3.
 */
export interface TableCommand {
  action: "play" | "pause" | "resume" | "stop" | "volume" | "brightness" | "ping";
  show_id?: string;
  /** Wall-clock ms — players use this to compute the loop sync offset. */
  timestamp?: number;
  /** 0..1 for volume / brightness commands. */
  value?: number;
  volume?: number;
  brightness?: number;
}

/**
 * Publishes commands to per-table Supabase Realtime broadcast channels
 * (`table:<tables.id>`). The Pi player subscribes to its own channel, so
 * commands work over the open internet — no LAN IP, no mixed-content issues.
 */
export class TableCommandPublisher {
  private client: SupabaseClient = createClient();
  private channels = new Map<string, RealtimeChannel>();
  private subscriptions = new Map<string, Promise<boolean>>();

  private channelFor(tableId: string): RealtimeChannel {
    let ch = this.channels.get(tableId);
    if (!ch) {
      ch = this.client.channel(`table:${tableId}`);
      this.channels.set(tableId, ch);
    }
    return ch;
  }

  private async ensureSubscribed(tableId: string): Promise<boolean> {
    const existing = this.subscriptions.get(tableId);
    if (existing) return existing;

    const ch = this.channelFor(tableId);
    const subscription = new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        resolve(ok);
      };
      const timeout = window.setTimeout(() => finish(false), 5_000);

      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") finish(true);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") finish(false);
      });
    });

    this.subscriptions.set(tableId, subscription);
    const ok = await subscription;
    if (!ok) {
      this.subscriptions.delete(tableId);
      this.client.removeChannel(ch);
      this.channels.delete(tableId);
    }
    return ok;
  }

  /** Returns true if the broadcast was accepted by Supabase Realtime. */
  async send(tableId: string, command: TableCommand): Promise<boolean> {
    try {
      const ready = await this.ensureSubscribed(tableId);
      if (!ready) return false;
      const res = await this.channelFor(tableId).send({
        type: "broadcast",
        event: "command",
        payload: command,
      });
      return res === "ok";
    } catch {
      return false;
    }
  }

  /** Tear down all channels (call on unmount). */
  dispose(): void {
    this.channels.forEach((ch) => this.client.removeChannel(ch));
    this.channels.clear();
    this.subscriptions.clear();
  }
}
