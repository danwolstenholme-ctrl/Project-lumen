"use client";

import { useState, KeyboardEvent } from "react";
import { X, ArrowRight } from "lucide-react";

export interface Details {
  title: string;
  description: string;
  category: string;
  tags: string[];
}

interface Step1DetailsProps {
  details: Details;
  onChange: (updates: Partial<Details>) => void;
  onNext: () => void;
}

const CATEGORIES = [
  "Ocean", "Fire", "Abstract", "Forest", "Space", "Seasonal", "Custom",
];

const MAX_DESC = 500;

export default function Step1Details({ details, onChange, onNext }: Step1DetailsProps) {
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !details.tags.includes(t) && details.tags.length < 10) {
      onChange({ tags: [...details.tags, t] });
    }
    setTagInput("");
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !tagInput && details.tags.length > 0) {
      onChange({ tags: details.tags.slice(0, -1) });
    }
  }

  const canProceed = details.title.trim().length > 0 && details.category.length > 0;

  return (
    <div className="flex flex-col gap-7">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <label className="font-manrope text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Show Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={details.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Abyssal Tide"
          maxLength={100}
          aria-label="Show title"
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-manrope text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-manrope text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
          <span className={`font-manrope text-xs tabular-nums ${details.description.length > MAX_DESC * 0.9 ? "text-amber-500 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-600"}`}>
            {details.description.length}/{MAX_DESC}
          </span>
        </div>
        <textarea
          value={details.description}
          onChange={(e) => onChange({ description: e.target.value.slice(0, MAX_DESC) })}
          placeholder="Describe the atmosphere, mood, and visual journey of your show…"
          rows={4}
          aria-label="Show description"
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-manrope text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors resize-none leading-relaxed"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2">
        <label className="font-manrope text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Category <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onChange({ category: cat })}
              className={`px-3.5 py-1.5 rounded-lg border text-sm font-manrope font-medium transition-all ${
                details.category === cat
                  ? "bg-fuchsia-600/20 border-fuchsia-500/50 text-fuchsia-500 dark:text-fuchsia-300"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <label className="font-manrope text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tags <span className="font-normal text-zinc-500 text-xs">(optional · up to 10)</span>
        </label>
        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors min-h-[48px]">
          {details.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-manrope text-zinc-700 dark:text-zinc-300"
            >
              {tag}
              <button type="button" title={`Remove tag ${tag}`} aria-label={`Remove tag ${tag}`} onClick={() => onChange({ tags: details.tags.filter((t) => t !== tag) })} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {details.tags.length < 10 && (
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={addTag}
              placeholder={details.tags.length === 0 ? "Type a tag and press Enter…" : ""}
              aria-label="Add a tag"
              className="flex-1 min-w-[120px] bg-transparent text-sm font-manrope text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Next */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-manrope font-semibold text-sm shadow-lg shadow-fuchsia-950/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          Continue to Media
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
