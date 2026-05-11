"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/app/dashboard/venue/toast";
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

  const wsRef = useRef<Map<string, WebSocket>>(new Map());

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

  // Cleanup WS on unmount
  useEffect(() => () => { wsRef.current.forEach((ws) => ws.close()); }, []);

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

  // ── WebSocket helpers ──
  const connectAndSend = useCallback((table: Table, msg: object) => {
    if (!table.ip_address) {
      toast.error(`${table.label} has no IP address configured`);
      return;
    }
    wsRef.current.get(table.id)?.close();
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${table.ip_address}:8765`);
    wsRef.current.set(table.id, ws);

    const timer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        setTables((p) => p.map((t) => (t.id === table.id ? { ...t, status: "offline" } : t)));
        setTablePlayMap((p) => { const n = new Map(p); n.delete(table.id); return n; });
        toast.error(`${table.label} is not responding. Check network connection.`);
      }
    }, 2000);

    ws.onopen = () => { clearTimeout(timer); ws.send(JSON.stringify(msg)); };
    ws.onerror = () => {
      clearTimeout(timer);
      setTables((p) => p.map((t) => (t.id === table.id ? { ...t, status: "offline" } : t)));
      setTablePlayMap((p) => { const n = new Map(p); n.delete(table.id); return n; });
      toast.error(`${table.label} is not responding. Check network connection.`);
    };
    ws.onclose = () => wsRef.current.delete(table.id);
  }, []);

  const broadcastToSelected = useCallback((msg: object) => {
    tables
      .filter((t) => selectedTableIds.has(t.id))
      .forEach((t) => {
        const ws = wsRef.current.get(t.id);
        if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
      });
  }, [tables, selectedTableIds]);

  // ── Transport controls ──
  const playOnSelected = useCallback((showId: string) => {
    const ts = Date.now();
    tables
      .filter((t) => selectedTableIds.has(t.id))
      .forEach((t) => {
        connectAndSend(t, { action: "play", show_id: showId, timestamp: ts });
        setTablePlayMap((p) => new Map(p).set(t.id, { showId, startedAt: ts, paused: false }));
        setTables((p) => p.map((x) => (x.id === t.id ? { ...x, status: "online_playing" } : x)));
      });
    setExpandedShowId(null);
  }, [tables, selectedTableIds, connectAndSend]);

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
    <div className="fixed inset-0 z-50 flex bg-[#0A0A0A] overflow-hidden" style={{ fontFamily: "var(--font-manrope)" }}>
      {/* Left — table list */}
      <div className="w-[260px] shrink-0 border-r border-white/[0.06] h-screen flex flex-col">
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
      <div className="flex-1 h-screen flex flex-col min-w-0">
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
      <div className="w-[320px] shrink-0 border-l border-white/[0.06] h-screen flex flex-col">
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
