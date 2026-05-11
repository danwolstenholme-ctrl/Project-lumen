"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Square, RefreshCw, Volume2, Sun, Film, MonitorPlay } from "lucide-react";
import type { Table, Show, TablePlayMap } from "./types";
import { computeNowPlaying, formatElapsed } from "./types";

interface NowPlayingProps {
  selectedTables: Table[];
  tablePlayMap: TablePlayMap;
  shows: Show[];
  volume: number;
  brightness: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onVolumeChange: (v: number) => void;
  onBrightnessChange: (v: number) => void;
  onSyncAll: () => void;
}

function ElapsedDisplay({ startedAt, paused, pausedAt }: { startedAt: number; paused: boolean; pausedAt?: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    function compute() {
      if (paused && pausedAt != null) {
        setElapsed(pausedAt - startedAt);
      } else {
        setElapsed(Date.now() - startedAt);
      }
    }
    compute();
    if (paused) return;
    const id = setInterval(compute, 500);
    return () => clearInterval(id);
  }, [startedAt, paused, pausedAt]);

  return (
    <span className="font-manrope tabular-nums text-2xl font-semibold text-white">
      {formatElapsed(elapsed)}
    </span>
  );
}

function TransportButton({
  icon: Icon, label, variant, onPress, disabled,
}: {
  icon: React.ElementType;
  label: string;
  variant: "play" | "pause" | "stop";
  onPress: () => void;
  disabled?: boolean;
}) {
  const base = "flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all active:scale-95 select-none";
  const size = "flex-1 py-4";
  const colors =
    variant === "play"
      ? "bg-gradient-to-br from-fuchsia-600 to-purple-700 text-white shadow-lg shadow-fuchsia-950/50"
      : variant === "pause"
      ? "bg-zinc-800 border border-zinc-700 text-zinc-200"
      : "bg-zinc-900 border border-zinc-800 text-zinc-400";
  const disabledCls = disabled ? "opacity-30 pointer-events-none" : "";

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`${base} ${size} ${colors} ${disabledCls}`}
      style={{ minHeight: 72 }}
    >
      <Icon className="w-6 h-6" strokeWidth={variant === "stop" ? 2 : 2} />
      <span className="font-manrope text-[10px] uppercase tracking-widest font-semibold">{label}</span>
    </button>
  );
}

function SliderRow({
  icon: Icon, label, value, onChange,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  onChange: (v: number) => void;
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
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          title={label}
          className="w-full h-1.5 accent-fuchsia-500 rounded-full cursor-pointer"
          style={{ minHeight: 24 }}
        />
      </div>
    </div>
  );
}

export default function NowPlaying({
  selectedTables, tablePlayMap, shows,
  volume, brightness,
  onPause, onResume, onStop, onVolumeChange, onBrightnessChange, onSyncAll,
}: NowPlayingProps) {
  const state = computeNowPlaying(selectedTables, tablePlayMap, shows);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
        <p className="font-raleway font-semibold text-white text-base" style={{ fontFamily: "var(--font-raleway)" }}>
          Now Playing
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">

        {/* Empty — no tables selected */}
        {state.type === "empty" && (
          <div className="flex flex-col items-center justify-center h-full px-6 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <MonitorPlay className="w-6 h-6 text-zinc-600" />
            </div>
            <div>
              <p className="font-raleway font-semibold text-zinc-500 text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
                No tables selected
              </p>
              <p className="font-manrope text-xs text-zinc-600 mt-1 leading-relaxed">
                Tap tables on the left to select them, then choose a show to play.
              </p>
            </div>
          </div>
        )}

        {/* Idle — tables selected, nothing playing */}
        {state.type === "idle" && (
          <div className="flex flex-col items-center justify-center h-full px-6 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Film className="w-6 h-6 text-zinc-600" />
            </div>
            <div>
              <p className="font-raleway font-semibold text-white text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
                {state.tables.length === 1 ? state.tables[0].label : `${state.tables.length} tables`} ready
              </p>
              <p className="font-manrope text-xs text-zinc-500 mt-1">
                Select a show from the library to play.
              </p>
            </div>
          </div>
        )}

        {/* Unified — all playing same show */}
        {state.type === "unified" && (
          <div className="flex flex-col gap-0">
            {/* Thumbnail with glow */}
            <div className="relative aspect-video bg-zinc-900 shrink-0">
              {state.show.thumbnail_url ? (
                <img src={state.show.thumbnail_url} alt={state.show.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-8 h-8 text-zinc-700" />
                </div>
              )}
              {/* Fuchsia glow overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
              {/* Playing indicator */}
              {!state.playState.paused && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
                  <span className="font-manrope text-[10px] text-zinc-300">Live</span>
                </div>
              )}
            </div>

            <div className="px-5 pt-4 flex flex-col gap-5">
              {/* Show info */}
              <div>
                <p
                  className="font-raleway font-semibold text-white text-base leading-tight"
                  style={{ fontFamily: "var(--font-raleway)" }}
                >
                  {state.show.title}
                </p>
                {state.show.artist_name && (
                  <p className="font-manrope text-xs text-zinc-400 mt-0.5">{state.show.artist_name}</p>
                )}
                <p className="font-manrope text-[11px] text-zinc-600 mt-1">
                  {state.tableCount} {state.tableCount === 1 ? "table" : "tables"}
                  {state.playState.paused && <span className="text-amber-400 ml-2">Paused</span>}
                </p>
              </div>

              {/* Elapsed */}
              <div className="flex flex-col gap-2">
                <ElapsedDisplay
                  startedAt={state.playState.startedAt}
                  paused={state.playState.paused}
                  pausedAt={state.playState.pausedAt}
                />
                {/* Indeterminate progress bar — no known duration */}
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  {!state.playState.paused ? (
                    <div className="h-full w-1/3 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-full animate-[slide_3s_linear_infinite]" />
                  ) : (
                    <div className="h-full w-1/4 bg-zinc-600 rounded-full" />
                  )}
                </div>
              </div>

              {/* Transport */}
              <div className="flex gap-2.5">
                {state.playState.paused ? (
                  <TransportButton icon={Play} label="Resume" variant="play" onPress={onResume} />
                ) : (
                  <TransportButton icon={Pause} label="Pause" variant="pause" onPress={onPause} />
                )}
                <TransportButton icon={Square} label="Stop" variant="stop" onPress={onStop} />
              </div>
            </div>
          </div>
        )}

        {/* Mixed — tables playing different shows */}
        {state.type === "mixed" && (
          <div className="px-5 pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-manrope text-xs text-zinc-400">Tables playing different shows</p>
              <button
                type="button"
                onClick={onSyncAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-manrope text-zinc-300 active:bg-zinc-700 transition-colors"
                style={{ minHeight: 32 }}
              >
                <RefreshCw className="w-3 h-3" />
                Sync All
              </button>
            </div>

            {state.items.map(({ table, show, playState }) => (
              <div key={table.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500 shrink-0" />
                  <span
                    className="font-raleway font-semibold text-white text-xs"
                    style={{ fontFamily: "var(--font-raleway)" }}
                  >
                    {table.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-3 pb-3">
                  {show.thumbnail_url && (
                    <img src={show.thumbnail_url} alt={show.title} className="w-10 h-[26px] rounded object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-manrope text-xs text-zinc-200 truncate">{show.title}</p>
                    <ElapsedDisplay
                      startedAt={playState.startedAt}
                      paused={playState.paused}
                      pausedAt={playState.pausedAt}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-2.5 mt-2">
              <TransportButton icon={Pause} label="Pause All" variant="pause" onPress={onPause} />
              <TransportButton icon={Square} label="Stop All" variant="stop" onPress={onStop} />
            </div>
          </div>
        )}
      </div>

      {/* AV Controls — always visible at bottom */}
      <div className="border-t border-white/[0.06] px-5 py-5 flex flex-col gap-4 shrink-0">
        <SliderRow icon={Volume2} label="Volume" value={volume} onChange={onVolumeChange} />
        <SliderRow icon={Sun} label="Brightness" value={brightness} onChange={onBrightnessChange} />
      </div>
    </div>
  );
}
