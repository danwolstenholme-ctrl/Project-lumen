"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Wifi, WifiOff, Loader2, Monitor, AlertCircle } from "lucide-react";
import { toast } from "@/utils/toast";

interface Table {
  id: string;
  label: string;
  ip_address: string | null;
  status: "online_playing" | "online_idle" | "offline";
}

interface Props {
  venueName: string;
  hasVenue: boolean;
  initialTables: Table[];
}

const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export default function TableManager({ venueName: initialVenueName, hasVenue, initialTables }: Props) {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [venueName, setVenueName] = useState(initialVenueName);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [editIp, setEditIp] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingVenueName, setEditingVenueName] = useState(!hasVenue);
  const [venueNameInput, setVenueNameInput] = useState(initialVenueName || "My Restaurant");

  async function saveVenueName() {
    setBusy(true);
    try {
      const res = await fetch("/api/venue/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: venueNameInput }),
      });
      if (!res.ok) throw new Error();
      setVenueName(venueNameInput);
      setEditingVenueName(false);
      toast.success("Venue name saved");
    } catch {
      toast.error("Couldn't save venue name");
    } finally {
      setBusy(false);
    }
  }

  function beginAdd() {
    setEditingId("__new__");
    setIsAdding(true);
    setEditLabel(`Table ${tables.length + 1}`);
    setEditIp("");
  }

  function beginEdit(t: Table) {
    setEditingId(t.id);
    setIsAdding(false);
    setEditLabel(t.label);
    setEditIp(t.ip_address ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setIsAdding(false);
  }

  async function saveTable() {
    if (!editLabel.trim()) {
      toast.error("Label is required");
      return;
    }
    if (editIp && !IP_REGEX.test(editIp)) {
      toast.error("IP must look like 192.168.1.50");
      return;
    }
    setBusy(true);
    try {
      const isNew = editingId === "__new__";
      const res = await fetch("/api/venue/tables", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isNew ? undefined : editingId,
          label: editLabel.trim(),
          ip_address: editIp.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      const { table } = await res.json();
      if (isNew) {
        setTables((prev) => [...prev, table]);
        toast.success(`${table.label} added`);
      } else {
        setTables((prev) => prev.map((t) => (t.id === table.id ? table : t)));
        toast.success("Table updated");
      }
      cancelEdit();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTable(t: Table) {
    if (!confirm(`Delete ${t.label}? This won't stop playback if currently live.`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/venue/tables", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id }),
      });
      if (!res.ok) throw new Error();
      setTables((prev) => prev.filter((x) => x.id !== t.id));
      toast.success(`${t.label} removed`);
    } catch {
      toast.error("Couldn't delete table");
    } finally {
      setBusy(false);
    }
  }

  async function pingTable(t: Table) {
    if (!t.ip_address) { toast.error("No IP configured"); return; }
    toast.success(`Pinging ${t.label}…`);
    try {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${proto}//${t.ip_address}:8765`);
      const timer = setTimeout(() => { ws.close(); toast.error(`${t.label} didn't respond`); }, 2500);
      ws.onopen = () => { clearTimeout(timer); ws.close(); toast.success(`${t.label} is online`); };
      ws.onerror = () => { clearTimeout(timer); toast.error(`${t.label} unreachable`); };
    } catch {
      toast.error(`Couldn't reach ${t.label}`);
    }
  }

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-raleway text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">Tables</h1>
        <p className="font-manrope text-sm text-zinc-500 mt-1">
          Each table is a projector running the Lumen player. Add the table's local IP so the dashboard can control it.
        </p>
      </div>

      {/* Venue name */}
      <section className="mb-8 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-manrope text-[11px] text-zinc-500 uppercase tracking-widest font-medium">Venue name</p>
            {editingVenueName ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={venueNameInput}
                  onChange={(e) => setVenueNameInput(e.target.value)}
                  maxLength={80}
                  placeholder="e.g. The Lumen Room"
                  className="flex-1 max-w-md px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm font-manrope text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
                />
                <button
                  type="button" title="Save venue name" onClick={saveVenueName} disabled={busy}
                  className="p-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                {hasVenue && (
                  <button
                    type="button" title="Cancel"
                    onClick={() => { setEditingVenueName(false); setVenueNameInput(venueName); }}
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <p className="font-raleway text-xl font-semibold text-zinc-900 dark:text-white truncate">{venueName || "—"}</p>
                <button type="button" title="Edit name" onClick={() => setEditingVenueName(true)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tables list */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-raleway text-base font-semibold text-zinc-900 dark:text-white">
            {tables.length} {tables.length === 1 ? "table" : "tables"}
          </h2>
          <button
            type="button"
            onClick={beginAdd}
            disabled={!hasVenue && !venueName}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-sm font-manrope font-semibold disabled:opacity-40 transition-all"
          >
            <Plus className="w-4 h-4" /> Add table
          </button>
        </div>

        {!hasVenue && !venueName && (
          <div className="mb-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="font-manrope text-sm text-amber-800 dark:text-amber-200">
              Save your venue name first, then add tables.
            </p>
          </div>
        )}

        {tables.length === 0 && editingId !== "__new__" ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="font-raleway text-zinc-900 dark:text-white font-semibold">No tables yet</p>
            <p className="font-manrope text-sm text-zinc-500 max-w-sm">
              Add a table for each projector in your dining room. You'll need each projector's local IP address.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
            {/* New row */}
            {editingId === "__new__" && (
              <EditRow
                label={editLabel}
                ip={editIp}
                onLabelChange={setEditLabel}
                onIpChange={setEditIp}
                onSave={saveTable}
                onCancel={cancelEdit}
                busy={busy}
              />
            )}

            {tables.map((t) => {
              const isEditing = editingId === t.id;
              if (isEditing) {
                return (
                  <EditRow
                    key={t.id}
                    label={editLabel}
                    ip={editIp}
                    onLabelChange={setEditLabel}
                    onIpChange={setEditIp}
                    onSave={saveTable}
                    onCancel={cancelEdit}
                    busy={busy}
                  />
                );
              }
              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    t.status === "online_playing" ? "bg-fuchsia-500 shadow-[0_0_6px_2px_rgba(217,70,239,0.5)]" :
                    t.status === "online_idle" ? "bg-amber-400" : "bg-red-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-raleway font-semibold text-zinc-900 dark:text-white">{t.label}</p>
                    <p className="font-manrope text-xs text-zinc-500 mt-0.5 font-mono">
                      {t.ip_address ? t.ip_address : <span className="italic text-zinc-400 dark:text-zinc-600">No IP set</span>}
                    </p>
                  </div>
                  <span className="font-manrope text-[10px] uppercase tracking-widest text-zinc-500 shrink-0">
                    {t.status === "online_playing" ? "Live" : t.status === "online_idle" ? "Idle" : "Offline"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {t.ip_address && (
                      <button type="button" title="Ping table" onClick={() => pingTable(t)} className="p-2 rounded-lg text-zinc-500 hover:text-fuchsia-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <Wifi className="w-4 h-4" />
                      </button>
                    )}
                    <button type="button" title="Edit table" onClick={() => beginEdit(t)} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" title="Delete table" onClick={() => deleteTable(t)} className="p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Help */}
      <section className="mt-8 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20">
        <p className="font-manrope text-[11px] uppercase tracking-widest text-zinc-500 font-semibold mb-2">Setup tips</p>
        <ul className="flex flex-col gap-1.5 text-sm font-manrope text-zinc-600 dark:text-zinc-400">
          <li>• Each Lumen player listens on port <span className="font-mono text-zinc-900 dark:text-zinc-200">8765</span>.</li>
          <li>• Use the projector's local IP — typically <span className="font-mono text-zinc-900 dark:text-zinc-200">192.168.x.x</span>.</li>
          <li>• Make sure your iPad and projectors are on the same Wi-Fi network.</li>
          <li>• Click <Wifi className="inline w-3 h-3 mx-0.5" /> to test connectivity to any table.</li>
        </ul>
      </section>
    </div>
  );
}

function EditRow({
  label, ip, onLabelChange, onIpChange, onSave, onCancel, busy,
}: {
  label: string; ip: string;
  onLabelChange: (v: string) => void; onIpChange: (v: string) => void;
  onSave: () => void; onCancel: () => void; busy: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 bg-zinc-50 dark:bg-white/[0.02]">
      <div className="w-2" />
      <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
        <input
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Table label (e.g. Window 1)"
          maxLength={40}
          className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm font-manrope text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
        />
        <input
          type="text"
          value={ip}
          onChange={(e) => onIpChange(e.target.value)}
          placeholder="192.168.1.50"
          className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
        />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button" title="Save" onClick={onSave} disabled={busy}
          className="p-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          type="button" title="Cancel" onClick={onCancel}
          className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
