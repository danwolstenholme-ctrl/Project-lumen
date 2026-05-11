export interface Table {
  id: string;
  label: string;
  ip_address: string | null;
  status: "online_playing" | "online_idle" | "offline";
}

export interface Show {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  artist_name: string | null;
  featured: boolean | null;
  artist_of_month: boolean | null;
}

export interface Venue {
  id: string;
  name: string;
}

export interface PlayState {
  showId: string;
  startedAt: number; // unix ms — all tables started simultaneously
  paused: boolean;
  pausedAt?: number;
}

export type TablePlayMap = Map<string, PlayState>;

export type NowPlayingState =
  | { type: "empty" }
  | { type: "idle"; tables: Table[] }
  | { type: "unified"; show: Show; playState: PlayState; tableCount: number }
  | { type: "mixed"; items: { table: Table; show: Show; playState: PlayState }[] };

export function computeNowPlaying(
  selectedTables: Table[],
  tablePlayMap: TablePlayMap,
  shows: Show[]
): NowPlayingState {
  if (selectedTables.length === 0) return { type: "empty" };

  const playingTables = selectedTables.filter((t) => tablePlayMap.has(t.id));
  if (playingTables.length === 0) return { type: "idle", tables: selectedTables };

  const showIds = new Set(playingTables.map((t) => tablePlayMap.get(t.id)!.showId));

  if (showIds.size === 1 && playingTables.length === selectedTables.length) {
    const showId = [...showIds][0];
    const show = shows.find((s) => s.id === showId);
    if (!show) return { type: "idle", tables: selectedTables };
    return {
      type: "unified",
      show,
      playState: tablePlayMap.get(playingTables[0].id)!,
      tableCount: playingTables.length,
    };
  }

  const items = playingTables.flatMap((t) => {
    const ps = tablePlayMap.get(t.id)!;
    const show = shows.find((s) => s.id === ps.showId);
    if (!show) return [];
    return [{ table: t, show, playState: ps }];
  });

  return { type: "mixed", items };
}

export function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
