"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { DollarSign, Clock, Calendar, Download, ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
import { toast } from "@/utils/toast";

interface EarningsRow {
  id: string;
  date: string;
  venueName: string;
  showTitle: string;
  licenseFee: number;
  artistShare: number;
  status: "pending" | "paid";
  paidAt: string | null;
}

interface MonthlyPoint { label: string; total: number; }

interface Props {
  rows: EarningsRow[];
  totalEarned: number;
  pendingPayout: number;
  lastPaidAmount: number | null;
  lastPaidDate: string | null;
  monthlyData: MonthlyPoint[];
  payoutMethod: string | null;
  payoutEmail: string | null;
  payoutIban: string | null;
}

const PAGE_SIZE = 20;

function fmt(n: number) {
  return `€${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function nextPayoutDate() {
  const n = new Date();
  const next = new Date(n.getFullYear(), n.getMonth() + 1, 1);
  return next.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function EarningsDashboard({
  rows, totalEarned, pendingPayout, lastPaidAmount, lastPaidDate,
  monthlyData, payoutMethod: initMethod, payoutEmail: initEmail, payoutIban: initIban,
}: Props) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<"date" | "amount">("date");
  const [sortAsc, setSortAsc] = useState(false);

  const [payoutMethod, setPayoutMethod] = useState(initMethod ?? "");
  const [payoutEmail, setPayoutEmail] = useState(initEmail ?? "");
  const [payoutIban, setPayoutIban] = useState(initIban ?? "");
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutSaved, setPayoutSaved] = useState(false);

  const sorted = [...rows].sort((a, b) => {
    const v = sortKey === "date"
      ? new Date(a.date).getTime() - new Date(b.date).getTime()
      : a.artistShare - b.artistShare;
    return sortAsc ? v : -v;
  });
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(key: "date" | "amount") {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(false); }
  }

  function exportCsv() {
    const header = "Date,Venue,Show,License Fee,Your Share (70%),Status\n";
    const body = rows.map((r) =>
      `${fmtDate(r.date)},"${r.venueName}","${r.showTitle}",${r.licenseFee.toFixed(2)},${r.artistShare.toFixed(2)},${r.status}`
    ).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lumen-earnings.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function savePayout() {
    setSavingPayout(true);
    try {
      const res = await fetch("/api/artist/payout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutMethod, payoutEmail, payoutIban }),
      });
      if (!res.ok) throw new Error();
      setPayoutSaved(true);
      toast.success("Payout settings saved");
      setTimeout(() => setPayoutSaved(false), 3000);
    } catch {
      toast.error("Failed to save payout settings");
    } finally {
      setSavingPayout(false);
    }
  }

  const maxBar = Math.max(...monthlyData.map((d) => d.total), 1);

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-raleway text-2xl font-semibold text-white tracking-tight">Earnings</h1>
          <p className="font-manrope text-sm text-zinc-400 mt-1">Your royalty history and payout settings</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-manrope font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Earned", value: fmt(totalEarned), icon: DollarSign, color: "text-emerald-400" },
          { label: "Pending Payout", value: fmt(pendingPayout), icon: Clock, color: "text-amber-400" },
          { label: "Last Payout", value: lastPaidAmount ? fmt(lastPaidAmount) : "—", sub: lastPaidDate ? fmtDate(lastPaidDate) : undefined, icon: Check, color: "text-purple-400" },
          { label: "Next Payout", value: nextPayoutDate(), icon: Calendar, color: "text-fuchsia-400" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="font-raleway text-lg font-semibold text-white truncate">{value}</p>
              {sub && <p className="font-manrope text-[10px] text-zinc-500">{sub}</p>}
              <p className="font-manrope text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 mb-8">
        <h2 className="font-raleway text-base font-semibold text-white mb-5">Monthly Earnings</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} barSize={24} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "#71717a", fontSize: 11, fontFamily: "var(--font-manrope)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#52525b", fontSize: 11, fontFamily: "var(--font-manrope)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${v}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontFamily: "var(--font-manrope)", fontSize: 12 }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(v) => [fmt(Number(v ?? 0)), "Earned"]}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {monthlyData.map((d, i) => (
                <Cell key={i} fill={d.total === maxBar ? "#d946ef" : "#a855f7"} opacity={d.total === 0 ? 0.2 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Earnings table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 mb-8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="font-raleway text-base font-semibold text-white">Transaction History</h2>
          <span className="font-manrope text-xs text-zinc-500">{rows.length} transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {[
                  { key: "date", label: "Date" },
                  { key: null, label: "Venue" },
                  { key: null, label: "Show" },
                  { key: null, label: "License Fee" },
                  { key: "amount", label: "Your Share (70%)" },
                  { key: null, label: "Status" },
                ].map(({ key, label }) => (
                  <th
                    key={label}
                    className={`px-5 py-3 text-left font-manrope text-[11px] uppercase tracking-widest text-zinc-500 font-medium ${key ? "cursor-pointer hover:text-zinc-300 select-none transition-colors" : ""}`}
                    onClick={key ? () => toggleSort(key as "date" | "amount") : undefined}
                  >
                    {label}{key && sortKey === key && (sortAsc ? " ↑" : " ↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center font-manrope text-sm text-zinc-600">
                    No earnings yet. Earnings appear when venues license your shows.
                  </td>
                </tr>
              ) : pageRows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-manrope text-sm text-zinc-400 whitespace-nowrap">{fmtDate(r.date)}</td>
                  <td className="px-5 py-3.5 font-manrope text-sm text-zinc-300">{r.venueName}</td>
                  <td className="px-5 py-3.5 font-manrope text-sm text-zinc-300 max-w-[200px] truncate">{r.showTitle}</td>
                  <td className="px-5 py-3.5 font-manrope text-sm text-zinc-400">{fmt(r.licenseFee)}</td>
                  <td className="px-5 py-3.5 font-manrope text-sm text-emerald-400 font-semibold">{fmt(r.artistShare)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-manrope font-medium px-2 py-0.5 rounded border ${
                      r.status === "paid"
                        ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                        : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                    }`}>
                      {r.status === "paid" ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {r.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800">
            <span className="font-manrope text-xs text-zinc-500">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" title="Previous page" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" title="Next page" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payout settings */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-raleway text-base font-semibold text-white">Payout Settings</h2>
            <p className="font-manrope text-xs text-zinc-500 mt-0.5">
              Minimum payout threshold: <span className="text-zinc-300">€50</span>. Paid monthly on the 1st.
            </p>
          </div>
          {pendingPayout < 50 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-manrope text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              {fmt(50 - pendingPayout)} until next payout
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-manrope text-xs text-zinc-500 uppercase tracking-widest">Payout Method</label>
            <select
              title="Payout method"
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-manrope text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
            >
              <option value="">Select method</option>
              <option value="paypal">PayPal</option>
              <option value="bank">Bank Transfer (IBAN)</option>
            </select>
          </div>
          {payoutMethod === "paypal" && (
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-manrope text-xs text-zinc-500 uppercase tracking-widest">PayPal Email</label>
              <input
                type="email"
                value={payoutEmail}
                onChange={(e) => setPayoutEmail(e.target.value)}
                placeholder="your@paypal.com"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-manrope text-white placeholder:text-zinc-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
              />
            </div>
          )}
          {payoutMethod === "bank" && (
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-manrope text-xs text-zinc-500 uppercase tracking-widest">IBAN</label>
              <input
                type="text"
                value={payoutIban}
                onChange={(e) => setPayoutIban(e.target.value)}
                placeholder="IE12 BOFI 9000 0112 3456 78"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-manrope text-white placeholder:text-zinc-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={savePayout}
          disabled={savingPayout || !payoutMethod}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-sm font-manrope font-semibold disabled:opacity-50 transition-all"
        >
          {payoutSaved ? <><Check className="w-4 h-4" /> Saved</> : "Save Payout Settings"}
        </button>
      </div>
    </div>
  );
}
