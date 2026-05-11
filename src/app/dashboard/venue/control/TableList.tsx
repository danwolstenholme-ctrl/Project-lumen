"use client";

import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import type { Table, Show, TablePlayMap } from "./types";

interface TableListProps {
  tables: Table[];
  selectedTableIds: Set<string>;
  tablePlayMap: TablePlayMap;
  shows: Show[];
  venueName: string;
  onToggleTable: (id: string) => void;
  onToggleAll: () => void;
}

function StatusDot({ status }: { status: Table["status"] }) {
  const cls =
    status === "online_playing"
      ? "bg-fuchsia-500 shadow-[0_0_6px_2px_rgba(217,70,239,0.5)]"
      : status === "online_idle"
      ? "bg-amber-400"
      : "bg-red-500";
  return <span className={`w-2 h-2 rounded-full shrink-0 ${cls}`} />;
}

export default function TableList({
  tables, selectedTableIds, tablePlayMap, shows, venueName,
  onToggleTable, onToggleAll,
}: TableListProps) {
  const allSelected = tables.length > 0 && selectedTableIds.size === tables.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <Link
          href="/dashboard/venue"
          className="inline-flex items-center gap-1.5 text-zinc-500 text-xs font-manrope mb-4 active:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Dashboard
        </Link>
        <p
          className="font-raleway text-white font-semibold text-base leading-tight"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          Tables
        </p>
        <p className="font-manrope text-xs text-zinc-500 mt-0.5 truncate">{venueName}</p>
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* All Tables */}
        <button
          type="button"
          onClick={onToggleAll}
          className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors active:bg-zinc-800/60 ${
            allSelected ? "bg-zinc-800/80" : "hover:bg-zinc-900/60"
          }`}
          style={{ minHeight: 52 }}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              allSelected
                ? "bg-gradient-to-br from-fuchsia-600 to-purple-600"
                : "bg-zinc-800 border border-zinc-700"
            }`}
          >
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-raleway font-semibold text-white text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
              All Tables
            </p>
            <p className="font-manrope text-[11px] text-zinc-500">
              {tables.length} {tables.length === 1 ? "table" : "tables"}
            </p>
          </div>
          {allSelected && (
            <span className="w-4 h-4 rounded-full bg-fuchsia-500 shrink-0" />
          )}
        </button>

        <div className="mx-5 h-px bg-white/[0.05] my-1" />

        {tables.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="font-manrope text-xs text-zinc-600">No tables configured</p>
          </div>
        )}

        {tables.map((table) => {
          const selected = selectedTableIds.has(table.id);
          const ps = tablePlayMap.get(table.id);
          const playingShow = ps ? shows.find((s) => s.id === ps.showId) : null;

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => onToggleTable(table.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors active:bg-zinc-800/60 ${
                selected ? "bg-zinc-800/60" : "hover:bg-zinc-900/40"
              }`}
              style={{ minHeight: 52 }}
            >
              {/* Selected indicator */}
              <div
                className={`w-1 h-8 rounded-full shrink-0 transition-all ${
                  selected ? "bg-fuchsia-500" : "bg-transparent"
                }`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StatusDot status={table.status} />
                  <p
                    className={`font-raleway font-semibold text-sm truncate transition-colors ${
                      selected ? "text-white" : "text-zinc-300"
                    }`}
                    style={{ fontFamily: "var(--font-raleway)" }}
                  >
                    {table.label}
                  </p>
                </div>
                <p className="font-manrope text-[11px] mt-0.5 truncate">
                  {playingShow ? (
                    <span className="text-fuchsia-400">{playingShow.title}</span>
                  ) : (
                    <span className="text-zinc-600">
                      {table.status === "offline" ? "Offline" : "Idle"}
                    </span>
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection count footer */}
      {selectedTableIds.size > 0 && (
        <div className="border-t border-white/[0.06] px-5 py-3">
          <p className="font-manrope text-xs text-zinc-400">
            <span className="text-fuchsia-400 font-semibold">{selectedTableIds.size}</span>
            {" "}
            {selectedTableIds.size === 1 ? "table" : "tables"} selected
          </p>
        </div>
      )}
    </div>
  );
}
