"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { TableCommandPublisher, type TableCommand } from "@/app/dashboard/venue/realtime";
import type { Table, Show, Venue, TablePlayMap } from "./types";
import TableList from "./TableList";
import ControlShowLibrary from "./ControlShowLibrary";
import NowPlaying from "./NowPlaying";

interface ControlPanelProps {
  initialTables: Table[];
  initialShows: Show[];
  venue: Venue;
  venueDbId: string;
}

export default function ControlPanel({ initialTables, initialShows, venue, venueDbId }: ControlPanelProps) {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [selectedTableIds, setSelectedTableIds] = useState<Set<string>>(new Set());
  const [tablePlayMap, setTablePlayMap] = useState<TablePlayMap>(new Map());
  const [expandedShowId, setExpandedShowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [volume, setVolume] = useState(80);
  const [brightness, setBrightness] = useState(90);

  const publisherRef = useRef<TableCommandPublisher | null>(null);
  const getPublisher = () => (publisherRef.current ??= new TableCommandPublisher());

  // Supabase realtime — live table status
  useEffect(() => {
    if (!venueDbId) return;
    const client = createClient();
    const ch = client
      .channel(`venue-tables-${venueDbId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tables", filter: `venue_id=eq.${venueDbId}` },
        (payload) => {
          const u = payload.new as Partial<Table> & { id: string };
          setTables((prev) =>
            prev.map((t) => (t.id === u.id ? { ...t, status: u.status ?? t.status } : t))
          );
        }
      )
      .subscribe();
    return () => { client.removeChannel(ch); };
  }, [venueDbId]);

  // Cleanup Realtime command channels on unmount
  useEffect(() => () => { publisherRef.current?.dispose(); }, []);

  // ── Table selection ──
  const toggleTable = useCallback((id: string) => {
    setSelectedTableIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedTableIds((prev) =>
      prev.size === tables.length ? new Set() : new Set(tables.map((t) => t.id))
    );
  }, [tables]);

  // ── Realtime command helpers ──
  const sendCommand = useCallback((table: Table, msg: TableCommand) => {
    void getPublisher().send(table.id, msg);
  }, []);

  const broadcastToSelected = useCallback((msg: TableCommand) => {
    tables
      .filter((t) => selectedTableIds.has(t.id))
      .forEach((t) => sendCommand(t, msg));
  }, [tables, selectedTableIds, sendCommand]);

  // ── Transport controls ──
  const playOnSelected = useCallback((showId: string) => {
    const ts = Date.now();
    tables
      .filter((t) => selectedTableIds.has(t.id))
      .forEach((t) => {
        sendCommand(t, { action: "play", show_id: showId, timestamp: ts });
        setTablePlayMap((p) => new Map(p).set(t.id, { showId, startedAt: ts, paused: false }));
        setTables((p) => p.map((x) => (x.id === t.id ? { ...x, status: "online_playing" } : x)));
      });
    setExpandedShowId(null);
  }, [tables, selectedTableIds, sendCommand]);

  const pauseSelected = useCallback(() => {
    broadcastToSelected({ action: "pause" });
    const now = Date.now();
    setTablePlayMap((p) => {
      const n = new Map(p);
      selectedTableIds.forEach((id) => {
        const ps = n.get(id);
        if (ps && !ps.paused) n.set(id, { ...ps, paused: true, pausedAt: now });
      });
      return n;
    });
  }, [broadcastToSelected, selectedTableIds]);

  const resumeSelected = useCallback(() => {
    const now = Date.now();
    setTablePlayMap((p) => {
      const n = new Map(p);
      selectedTableIds.forEach((id) => {
        const ps = n.get(id);
        if (ps?.paused && ps.pausedAt != null) {
          n.set(id, { ...ps, paused: false, startedAt: ps.startedAt + (now - ps.pausedAt), pausedAt: undefined });
        }
      });
      return n;
    });
    broadcastToSelected({ action: "resume" });
  }, [broadcastToSelected, selectedTableIds]);

  const stopSelected = useCallback(() => {
    broadcastToSelected({ action: "stop" });
    setTablePlayMap((p) => {
      const n = new Map(p);
      selectedTableIds.forEach((id) => n.delete(id));
      return n;
    });
    setTables((p) =>
      p.map((t) => (selectedTableIds.has(t.id) ? { ...t, status: "online_idle" } : t))
    );
  }, [broadcastToSelected, selectedTableIds]);

  const syncAllTables = useCallback(() => {
    stopSelected();
    // Centre column shows full library — user picks a show
  }, [stopSelected]);

  const handleVolumeChange = useCallback((val: number) => {
    setVolume(val);
    broadcastToSelected({ action: "volume", value: val / 100 });
  }, [broadcastToSelected]);

  const handleBrightnessChange = useCallback((val: number) => {
    setBrightness(val);
    broadcastToSelected({ action: "brightness", value: val / 100 });
  }, [broadcastToSelected]);

  const selectedTables = tables.filter((t) => selectedTableIds.has(t.id));

  return (
    <div className="fixed inset-0 z-50 flex h-dvh flex-col lg:flex-row bg-[#0A0A0A] overflow-hidden safe-screen" style={{ fontFamily: "var(--font-manrope)" }}>
      {/* Left — table list */}
      <div className="h-[190px] sm:h-[220px] lg:h-auto lg:w-[260px] shrink-0 border-b border-white/[0.06] lg:border-b-0 lg:border-r flex flex-col">
        <TableList
          tables={tables}
          selectedTableIds={selectedTableIds}
          tablePlayMap={tablePlayMap}
          shows={initialShows}
          venueName={venue.name}
          onToggleTable={toggleTable}
          onToggleAll={toggleAll}
        />
      </div>

      {/* Centre — show library */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0">
        <ControlShowLibrary
          shows={initialShows}
          searchQuery={searchQuery}
          activeCategory={activeCategory}
          expandedShowId={expandedShowId}
          selectedCount={selectedTableIds.size}
          onSearchChange={setSearchQuery}
          onCategoryChange={setActiveCategory}
          onExpandShow={setExpandedShowId}
          onPlayOnSelected={playOnSelected}
        />
      </div>

      {/* Right — now playing */}
      <div className="h-[260px] sm:h-[280px] lg:h-auto lg:w-[320px] shrink-0 border-t border-white/[0.06] lg:border-t-0 lg:border-l flex flex-col">
        <NowPlaying
          selectedTables={selectedTables}
          tablePlayMap={tablePlayMap}
          shows={initialShows}
          volume={volume}
          brightness={brightness}
          onPause={pauseSelected}
          onResume={resumeSelected}
          onStop={stopSelected}
          onVolumeChange={handleVolumeChange}
          onBrightnessChange={handleBrightnessChange}
          onSyncAll={syncAllTables}
        />
      </div>
    </div>
  );
}
