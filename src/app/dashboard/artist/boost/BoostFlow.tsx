"use client";

import { useState } from "react";
import { Sparkles, Globe, Check, Loader2, ArrowLeft, Film } from "lucide-react";
import Link from "next/link";

interface Show { id: string; title: string; thumbnail_url: string | null; featured: boolean | null; featured_until: string | null; }

interface Props {
  shows: Show[];
  preselectedShowId: string | null;
  success: boolean;
}

type PlacementType = "featured_show" | "homepage_feature";

const PLACEMENTS: { type: PlacementType; label: string; price: number; desc: string; icon: React.ElementType }[] = [
  {
    type: "featured_show",
    label: "Featured Show",
    price: 75,
    desc: "Your show appears at the top of every venue's show library with a Featured badge.",
    icon: Sparkles,
  },
  {
    type: "homepage_feature",
    label: "Homepage Feature",
    price: 150,
    desc: "Your show appears in the Featured Experiences section on the Project Lumen marketing homepage.",
    icon: Globe,
  },
];

const DURATIONS: { months: number; label: string; discount: number }[] = [
  { months: 1, label: "1 Month",  discount: 0 },
  { months: 3, label: "3 Months", discount: 10 },
  { months: 6, label: "6 Months", discount: 20 },
];

export default function BoostFlow({ shows, preselectedShowId, success }: Props) {
  const [step, setStep] = useState(success ? 3 : 0);
  const [placement, setPlacement] = useState<PlacementType | null>(null);
  const [selectedShowId, setSelectedShowId] = useState(preselectedShowId ?? (shows[0]?.id ?? null));
  const [months, setMonths] = useState(1);
  const [loading, setLoading] = useState(false);

  if (success || step === 3) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-8 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
          <Check className="w-10 h-10 text-fuchsia-400" />
        </div>
        <div>
          <h1 className="font-raleway text-2xl font-semibold text-zinc-900 dark:text-white">Your show is now featured.</h1>
          <p className="font-manrope text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-sm">
            Venues will see it at the top of their library. You&apos;ll receive a confirmation email shortly.
          </p>
        </div>
        <Link
          href="/dashboard/artist"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-sm font-manrope font-semibold hover:from-fuchsia-500 hover:to-purple-500 transition-all"
        >
          Back to Studio
        </Link>
      </div>
    );
  }

  const selectedPlacement = PLACEMENTS.find((p) => p.type === placement);
  const selectedDuration = DURATIONS.find((d) => d.months === months)!;
  const basePrice = selectedPlacement?.price ?? 0;
  const total = basePrice * months * (1 - selectedDuration.discount / 100);

  async function startCheckout() {
    if (!placement || !selectedShowId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/boost/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placement, showId: selectedShowId, months }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/artist" className="inline-flex items-center gap-1.5 text-sm font-manrope text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Studio
        </Link>
        <h1 className="font-raleway text-2xl font-semibold text-zinc-900 dark:text-white">Boost Your Show</h1>
        <p className="font-manrope text-sm text-zinc-600 dark:text-zinc-400 mt-1">Get featured placement in the venue show library.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-10">
        {["Placement", "Duration", "Payment"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-manrope font-semibold ${
              step > i ? "bg-fuchsia-600 text-white" : step === i ? "bg-fuchsia-600/20 border border-fuchsia-500/50 text-fuchsia-500 dark:text-fuchsia-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-600"
            }`}>
              {step > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-manrope ${step >= i ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600"}`}>{label}</span>
            {i < 2 && <div className={`w-8 h-px ${step > i ? "bg-fuchsia-600/50" : "bg-zinc-200 dark:bg-zinc-800"}`} />}
          </div>
        ))}
      </div>

      {/* Step 0 — Placement */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-raleway text-lg font-semibold text-zinc-900 dark:text-white mb-2">Choose placement</h2>
          {PLACEMENTS.map(({ type, label, price, desc, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setPlacement(type)}
              className={`w-full text-left p-6 rounded-xl border transition-all ${
                placement === type
                  ? "border-fuchsia-500/60 bg-fuchsia-500/5"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${placement === type ? "bg-fuchsia-500/15" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                  <Icon className={`w-6 h-6 ${placement === type ? "text-fuchsia-400" : "text-zinc-500"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-raleway font-semibold text-zinc-900 dark:text-white text-base">{label}</p>
                    <p className="font-raleway text-xl font-bold text-zinc-900 dark:text-white">€{price}<span className="text-sm font-manrope text-zinc-500 dark:text-zinc-400">/mo</span></p>
                  </div>
                  <p className="font-manrope text-sm text-zinc-600 dark:text-zinc-400 mt-1">{desc}</p>
                </div>
              </div>
            </button>
          ))}

          {/* Show selector */}
          {placement && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="font-manrope text-xs text-zinc-500 uppercase tracking-widest">Select show to boost</p>
              <div className="flex flex-col gap-2">
                {shows.map((show) => (
                  <button
                    key={show.id}
                    type="button"
                    onClick={() => setSelectedShowId(show.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      selectedShowId === show.id ? "border-fuchsia-500/50 bg-fuchsia-500/5" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="w-12 h-8 rounded overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                      {show.thumbnail_url
                        ? <img src={show.thumbnail_url} alt={show.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Film className="w-4 h-4 text-zinc-400 dark:text-zinc-600" /></div>
                      }
                    </div>
                    <span className="font-manrope text-sm text-zinc-900 dark:text-white">{show.title}</span>
                    {selectedShowId === show.id && <Check className="w-4 h-4 text-fuchsia-400 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={!placement || !selectedShowId}
            className="mt-4 w-full py-3 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-manrope font-semibold disabled:opacity-40 hover:from-fuchsia-500 hover:to-purple-500 transition-all"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 1 — Duration */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-raleway text-lg font-semibold text-zinc-900 dark:text-white mb-2">Choose duration</h2>
          <div className="grid grid-cols-3 gap-4">
            {DURATIONS.map(({ months: m, label, discount }) => {
              const price = (selectedPlacement?.price ?? 0) * m * (1 - discount / 100);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all ${
                    months === m ? "border-fuchsia-500/60 bg-fuchsia-500/5" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <span className="font-raleway font-semibold text-zinc-900 dark:text-white text-base">{label}</span>
                  <span className="font-raleway text-xl font-bold text-zinc-900 dark:text-white">€{price.toFixed(0)}</span>
                  {discount > 0 && (
                    <span className="text-[11px] font-manrope font-semibold text-emerald-500 dark:text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded">
                      {discount}% off
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 mt-2">
            <div className="flex items-center justify-between">
              <span className="font-manrope text-sm text-zinc-600 dark:text-zinc-400">Total</span>
              <span className="font-raleway text-2xl font-bold text-zinc-900 dark:text-white">€{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => setStep(0)} className="flex-1 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-manrope font-semibold hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              Back
            </button>
            <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-manrope font-semibold hover:from-fuchsia-500 hover:to-purple-500 transition-all">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Payment summary + Stripe redirect */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-raleway text-lg font-semibold text-zinc-900 dark:text-white mb-2">Review & pay</h2>
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm font-manrope">
              <span className="text-zinc-600 dark:text-zinc-400">Placement</span>
              <span className="text-zinc-900 dark:text-white">{selectedPlacement?.label}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-manrope">
              <span className="text-zinc-600 dark:text-zinc-400">Duration</span>
              <span className="text-zinc-900 dark:text-white">{selectedDuration.label}</span>
            </div>
            {selectedDuration.discount > 0 && (
              <div className="flex items-center justify-between text-sm font-manrope">
                <span className="text-zinc-600 dark:text-zinc-400">Discount</span>
                <span className="text-emerald-500 dark:text-emerald-400">−{selectedDuration.discount}%</span>
              </div>
            )}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex items-center justify-between">
              <span className="font-manrope text-sm text-zinc-600 dark:text-zinc-400">Total</span>
              <span className="font-raleway text-2xl font-bold text-zinc-900 dark:text-white">€{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-manrope font-semibold hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              Back
            </button>
            <button
              type="button"
              onClick={startCheckout}
              disabled={loading}
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-manrope font-semibold hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : "Pay with Stripe"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
