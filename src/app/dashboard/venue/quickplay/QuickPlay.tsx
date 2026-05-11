"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Play, Pause, Square, Volume2, Sun, Film, Sparkles, Settings2, X, Check,
  MonitorPlay, Layers, Wifi, WifiOff, Search, AlertCircle, ChevronRight, Zap,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/app/dashboard/venue/toast";

interface Show {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  featured: boolean;
  artist_name: string | null;
}

interface Table {
  id: string;
  label: string;
  ip_address: string | null;
  status: "online_playing" | "online_idle" | "offline";
}

interface Props {
  venueName: string;
  venueDbId: string;
  tables: Table[];
  shows: Show[];
  defaultShow: Show | null;
  initialVolume: number;
  initialBrightness: number;
}

function liveClock() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function QuickPlay({
  venueName, venueDbId, tables: initialTables, shows, defaultShow: initialDefault,
  initialVolume, initialBrightness,
}: Props) {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [defaultShow, setDefaultShow] = useState<Show | null>(initialDefault);
  const [playingShowId, setPlayingShowId] = useState<string | null>(null);
  const [volume, setVolume] = useState(initialVolume);
  const [brightness, setBrightness] = useState(initialBrightness);
  const [clock, setClock] = useState(liveClock());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const wsRef = useRef<Map<string, WebSocket>>(new Map());

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setClock(liveClock()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Realtime table status from Supabase
  useEffect(() => {
    if (!venueDbId) return;
    const client = createClient();
    const ch = client
      .channel(`venue-tables-quickplay-${venueDbId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tables", filter: `venue_id=eq.${venueDbId}` },
        (payload) => {
          const u = payload.new as Partial<Table> & { id: string };
          setTables((prev) => prev.map((t) => (t.id === u.id ? { ...t, status: u.status ?? t.status } : t)));
        }
      )
      .subscribe();
    return () => { client.removeChannel(ch); };
  }, [venueDbId]);

  // Cleanup websockets
  useEffect(() => () => { wsRef.current.forEach((ws) => ws.close()); }, []);

  const onlineTables = tables.filter((t) => t.status !== "offline");
  const playingTables = tables.filter((t) => t.status === "online_playing");

  const connectAndSend = useCallback((table: Table, msg: object) => {
    if (!table.ip_address) {
      toast.error(`${table.label} has no IP configured`);
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
      }
    }, 2000);
    ws.onopen = () => { clearTimeout(timer); ws.send(JSON.stringify(msg)); };
    ws.onerror = () => {
      clearTimeout(timer);
      setTables((p) => p.map((t) => (t.id === table.id ? { ...t, status: "offline" } : t)));
    };
    ws.onclose = () => wsRef.current.delete(table.id);
  }, []);

  const broadcast = useCallback((msg: object) => {
    tables
      .filter((t) => t.status !== "offline")
      .forEach((t) => {
        const open = wsRef.current.get(t.id);
        if (open?.readyState === WebSocket.OPEN) open.send(JSON.stringify(msg));
        else connectAndSend(t, msg);
      });
  }, [tables, connectAndSend]);

  // ── The one button: play across every online table ──
  const playEverywhere = useCallback((show: Show) => {
    if (tables.length === 0) {
      toast.error("Add tables in Settings first");
      return;
    }
    const ts = Date.now();
    const target = tables.filter((t) => t.status !== "offline");
    if (target.length === 0) {
      toast.error("No tables online. Check your projector network.");
      return;
    }
    target.forEach((t) => connectAndSend(t, { action: "play", show_id: show.id, timestamp: ts }));
    setTables((prev) =>
      prev.map((t) => (target.some((x) => x.id === t.id) ? { ...t, status: "online_playing" } : t))
    );
    setPlayingShowId(show.id);
    toast.success(`Now playing ${show.title} on ${target.length} ${target.length === 1 ? "table" : "tables"}`);
  }, [tables, connectAndSend]);

  const stopEverywhere = useCallback(() => {
    broadcast({ action: "stop" });
    setTables((prev) => prev.map((t) => (t.status === "online_playing" ? { ...t, status: "online_idle" } : t)));
    setPlayingShowId(null);
    toast.success("All tables stopped");
  }, [broadcast]);

  const handleVolume = useCallback((v: number) => {
    setVolume(v);
    broadcast({ action: "volume", value: v / 100 });
  }, [broadcast]);

  const handleBrightness = useCallback((v: number) => {
    setBrightness(v);
    broadcast({ action: "brightness", value: v / 100 });
  }, [broadcast]);

  async function setAsDefault(show: Show) {
    setSavingDefault(true);
    try {
      const res = await fetch("/api/venue/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_show_id: show.id }),
      });
      if (!res.ok) throw new Error();
      setDefaultShow(show);
      setPickerOpen(false);
      toast.success(`${show.title} is now your default show`);
    } catch {
      toast.error("Couldn't save default show");
    } finally {
      setSavingDefault(false);
    }
  }

  const filteredShows = shows.filter((s) =>
    !searchQuery ||
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.artist_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.category ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isPlaying = playingShowId !== null;

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-[#0A0A0A] text-white overflow-hidden"
      style={{ fontFamily: "var(--font-manrope)" }}
    >
      {/* ── Top bar ── */}
      <header className="shrink-0 px-8 py-5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/venue"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white transition-colors text-xs font-manrope"
          >
            <Layers className="w-3.5 h-3.5" /> Library
          </Link>
          <div className="h-6 w-px bg-white/[0.06]" />
          <div>
            <p className="font-raleway text-base font-semibold">{venueName}</p>
            <p className="font-manrope text-[11px] text-zinc-500 mt-0.5">Quick Play · iPad mode</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <span className="font-raleway text-2xl font-semibold tabular-nums">{clock}</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <span className={`w-2 h-2 rounded-full ${onlineTables.length > 0 ? "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" : "bg-red-500"}`} />
            <span className="font-manrope text-xs text-zinc-300">
              {onlineTables.length}/{tables.length} {tables.length === 1 ? "table" : "tables"} online
            </span>
          </div>
          <Link
            href="/dashboard/venue/control"
            className="inline-flex items-center gap-1.5 text-xs font-manrope text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Advanced control <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* ── Main: hero + side panel ── */}
      <div className="flex-1 flex min-h-0">
        {/* Centre: the hero card */}
        <div className="flex-1 flex items-center justify-center p-10">
          {tables.length === 0 ? (
            <EmptyTablesCTA />
          ) : shows.length === 0 ? (
            <EmptyShowsCTA />
          ) : (
            <div className="w-full max-w-4xl flex flex-col gap-8">
              {/* Eyebrow */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300 text-[10px] uppercase tracking-widest font-manrope font-semibold">
                  <Sparkles className="w-3 h-3" /> Tonight's Show
                </span>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-manrope text-zinc-400 hover:text-white transition-colors"
                >
                  <Settings2 className="w-3.5 h-3.5" /> Change default
                </button>
              </div>

              {/* Hero card */}
              <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] aspect-[2/1]">
                {defaultShow?.thumbnail_url ? (
                  <img src={defaultShow.thumbnail_url} alt={defaultShow.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950/40 to-purple-950/40 flex items-center justify-center">
                    <Film className="w-16 h-16 text-zinc-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Live pill */}
                {isPlaying && playingShowId === defaultShow?.id && (
                  <div className="absolute top-5 right-5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-fuchsia-500/20 backdrop-blur-md border border-fuchsia-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
                    <span className="font-manrope text-[10px] font-semibold uppercase tracking-widest text-fuchsia-200">Live</span>
                  </div>
                )}

                {/* Hero text + button */}
                <div className="absolute inset-x-0 bottom-0 p-10 flex items-end justify-between gap-8">
                  <div className="flex-1 min-w-0">
                    <h1 className="font-raleway text-5xl font-bold tracking-tight leading-none">
                      {defaultShow?.title ?? "Pick a show"}
                    </h1>
                    {defaultShow?.artist_name && (
                      <p className="font-manrope text-zinc-300 mt-2 text-base">by {defaultShow.artist_name}</p>
                    )}
                  </div>

                  {defaultShow && (
                    <button
                      type="button"
                      onClick={() => isPlaying ? stopEverywhere() : playEverywhere(defaultShow)}
                      disabled={onlineTables.length === 0}
                      className={`relative shrink-0 inline-flex items-center gap-3 px-8 py-5 rounded-2xl font-raleway text-lg font-bold tracking-wide transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                        isPlaying
                          ? "bg-zinc-100 text-zinc-900 hover:bg-white shadow-2xl"
                          : "bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white shadow-[0_20px_60px_-15px_rgba(217,70,239,0.6)]"
                      }`}
                      style={{ minHeight: 72, minWidth: 240 }}
                    >
                      {isPlaying ? (
                        <>
                          <Square className="w-6 h-6" fill="currentColor" />
                          Stop All Tables
                        </>
                      ) : (
                        <>
                          <Play className="w-6 h-6" fill="currentColor" />
                          Start the Show
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Quick-play other shows row */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-manrope text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                    Or play something else
                  </p>
                  <span className="font-manrope text-[11px] text-zinc-600">
                    {shows.length} licensed {shows.length === 1 ? "show" : "shows"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {shows.slice(0, 4).map((show) => {
                    const isThisPlaying = playingShowId === show.id;
                    return (
                      <button
                        key={show.id}
                        type="button"
                        onClick={() => isThisPlaying ? stopEverywhere() : playEverywhere(show)}
                        disabled={onlineTables.length === 0}
                        className={`group relative rounded-xl overflow-hidden border transition-all active:scale-[0.97] disabled:opacity-50 ${
                          isThisPlaying ? "border-fuchsia-500/60 shadow-[0_0_30px_-5px_rgba(217,70,239,0.5)]" : "border-white/[0.08] hover:border-white/[0.2]"
                        }`}
                        style={{ minHeight: 44 }}
                      >
                        <div className="relative aspect-video bg-zinc-900">
                          {show.thumbnail_url ? (
                            <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Film className="w-5 h-5 text-zinc-700" /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                          {isThisPlaying ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-fuchsia-600/30 backdrop-blur-sm">
                              <Square className="w-6 h-6 text-white" fill="currentColor" />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                              <Play className="w-7 h-7 text-white" fill="white" />
                            </div>
                          )}
                          <div className="absolute bottom-1.5 left-2 right-2">
                            <p className="font-raleway font-semibold text-xs leading-tight line-clamp-1 text-left">
                              {show.title}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {shows.length > 4 && (
                  <Link
                    href="/dashboard/venue/control"
                    className="block mt-3 text-center font-manrope text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Browse all {shows.length} licensed shows →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: tables status panel */}
        <aside className="w-[300px] shrink-0 border-l border-white/[0.06] flex flex-col">
          <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
            <p className="font-raleway font-semibold text-sm">Tables</p>
            <Link href="/dashboard/venue/tables" className="text-zinc-500 hover:text-white transition-colors">
              <Settings2 className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {tables.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Wifi className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                <p className="font-manrope text-xs text-zinc-500">No tables configured</p>
                <Link href="/dashboard/venue/tables" className="mt-2 inline-block font-manrope text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                  Add tables →
                </Link>
              </div>
            ) : (
              tables.map((t) => (
                <div key={t.id} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      t.status === "online_playing" ? "bg-fuchsia-500 shadow-[0_0_6px_2px_rgba(217,70,239,0.5)]" :
                      t.status === "online_idle" ? "bg-amber-400" : "bg-red-500"
                    }`} />
                    <p className="font-raleway font-semibold text-sm truncate">{t.label}</p>
                  </div>
                  <span className="font-manrope text-[10px] text-zinc-500 uppercase tracking-widest shrink-0">
                    {t.status === "online_playing" ? "Live" : t.status === "online_idle" ? "Idle" : "Offline"}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* AV controls */}
          <div className="border-t border-white/[0.06] px-6 py-5 flex flex-col gap-4">
            <SliderRow icon={Volume2} label="Volume" value={volume} onChange={handleVolume} />
            <SliderRow icon={Sun} label="Brightness" value={brightness} onChange={handleBrightness} />
          </div>
        </aside>
      </div>

      {/* ── Default-show picker modal ── */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={() => setPickerOpen(false)}>
          <div
            className="relative w-full max-w-3xl max-h-[80vh] flex flex-col rounded-3xl overflow-hidden border border-white/[0.08] bg-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-7 py-5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="font-raleway text-xl font-semibold">Pick tonight's show</p>
                <p className="font-manrope text-xs text-zinc-500 mt-0.5">Sets the default. You can change anytime.</p>
              </div>
              <button type="button" onClick={() => setPickerOpen(false)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-7 py-4 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search shows, artists, categories…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-manrope text-white placeholder:text-zinc-500 focus:outline-none focus:border-fuchsia-500/40 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-7">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredShows.map((show) => {
                  const selected = defaultShow?.id === show.id;
                  return (
                    <button
                      key={show.id}
                      type="button"
                      onClick={() => setAsDefault(show)}
                      disabled={savingDefault}
                      className={`group rounded-xl overflow-hidden border text-left transition-all ${
                        selected ? "border-fuchsia-500/60 shadow-[0_0_30px_-5px_rgba(217,70,239,0.4)]" : "border-white/[0.08] hover:border-white/[0.2]"
                      }`}
                    >
                      <div className="relative aspect-video bg-zinc-900">
                        {show.thumbnail_url ? (
                          <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Film className="w-6 h-6 text-zinc-700" /></div>
                        )}
                        {selected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-raleway font-semibold text-sm leading-tight line-clamp-1">{show.title}</p>
                        {show.artist_name && (
                          <p className="font-manrope text-[11px] text-zinc-500 mt-0.5 truncate">{show.artist_name}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {filteredShows.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                  <Film className="w-8 h-8 text-zinc-700" />
                  <p className="font-manrope text-sm text-zinc-500">No matches</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SliderRow({ icon: Icon, label, value, onChange }: {
  icon: React.ElementType; label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-manrope text-[11px] text-zinc-500 uppercase tracking-widest">{label}</span>
          <span className="font-manrope text-xs text-zinc-400 tabular-nums">{value}%</span>
        </div>
        <input
          type="range" min={0} max={100} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 accent-fuchsia-500 rounded-full cursor-pointer"
          style={{ minHeight: 24 }}
        />
      </div>
    </div>
  );
}

function EmptyTablesCTA() {
  return (
    <div className="max-w-md mx-auto text-center flex flex-col items-center gap-5">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-fuchsia-950/40 to-purple-950/40 border border-white/[0.08] flex items-center justify-center">
        <WifiOff className="w-9 h-9 text-zinc-600" />
      </div>
      <div>
        <h2 className="font-raleway text-2xl font-semibold">No tables yet</h2>
        <p className="font-manrope text-sm text-zinc-500 mt-2">
          Add at least one table to start playing shows. Each table has its own IP address for the projector below.
        </p>
      </div>
      <Link
        href="/dashboard/venue/tables"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white font-manrope font-semibold transition-all"
      >
        <Zap className="w-4 h-4" /> Add your first table
      </Link>
    </div>
  );
}

function EmptyShowsCTA() {
  return (
    <div className="max-w-md mx-auto text-center flex flex-col items-center gap-5">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-fuchsia-950/40 to-purple-950/40 border border-white/[0.08] flex items-center justify-center">
        <Film className="w-9 h-9 text-zinc-600" />
      </div>
      <div>
        <h2 className="font-raleway text-2xl font-semibold">No shows licensed yet</h2>
        <p className="font-manrope text-sm text-zinc-500 mt-2">
          Browse the library and license at least one show — €30, permanent — to start playing it across your tables.
        </p>
      </div>
      <Link
        href="/dashboard/venue"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white font-manrope font-semibold transition-all"
      >
        <MonitorPlay className="w-4 h-4" /> Open the Show Library
      </Link>
    </div>
  );
}
