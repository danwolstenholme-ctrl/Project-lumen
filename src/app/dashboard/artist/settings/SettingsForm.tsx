"use client";

import { useState, useRef } from "react";
import { Check, Loader2, Upload, User, Link as LinkIcon, Bell, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "@/utils/toast";

interface Props {
  userId: string;
  initialName: string;
  initialBio: string;
  initialContactEmail: string;
  initialSlug: string;
  initialAvatarUrl: string | null;
  initialNotifyOnLicense: boolean;
}

export default function SettingsForm({
  initialName, initialBio, initialContactEmail,
  initialSlug, initialAvatarUrl, initialNotifyOnLicense,
}: Props) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [contactEmail, setContactEmail] = useState(initialContactEmail);
  const [slug, setSlug] = useState(initialSlug);
  const [notifyOnLicense, setNotifyOnLicense] = useState(initialNotifyOnLicense);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function slugify(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  async function uploadAvatar(file: File) {
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/artist/avatar", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setAvatarUrl(url);
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function save() {
    setSlugError(null);
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      setSlugError("Slug can only contain lowercase letters, numbers, and hyphens.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/artist/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, contactEmail, slug, notifyOnLicense }),
      });
      if (res.status === 409) { setSlugError("That slug is already taken."); return; }
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-8 py-8 max-w-2xl mx-auto w-full">
      <h1 className="font-raleway text-2xl font-semibold text-zinc-900 dark:text-white mb-8">Profile Settings</h1>

      {/* Avatar */}
      <section className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-raleway text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <User className="w-4 h-4" /> Profile
        </h2>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 ring-2 ring-zinc-200 dark:ring-zinc-700 flex items-center justify-center">
                <span className="font-raleway text-xl font-bold text-zinc-500 dark:text-zinc-300">{name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-manrope text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Upload photo
            </button>
            <p className="font-manrope text-xs text-zinc-500 mt-1.5">JPG or PNG, max 2MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png"
              aria-label="Upload avatar photo"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-5">
          <Field label="Display Name" value={name} onChange={setName} maxLength={80} />
          <Field label="Bio" value={bio} onChange={setBio} maxLength={300} multiline
            hint={`${bio.length}/300`} />
          <Field label="Contact Email" value={contactEmail} onChange={setContactEmail} type="email"
            hint="Shown on your public profile" />
        </div>
      </section>

      {/* Slug */}
      <section className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-raleway text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <LinkIcon className="w-4 h-4" /> Public Profile URL
        </h2>
        <div className="flex items-center gap-0 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 focus-within:border-fuchsia-500 transition-colors">
          <span className="px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-sm font-manrope text-zinc-500 shrink-0 border-r border-zinc-300 dark:border-zinc-700">
            projectlumen.io/artists/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="your-name"
            aria-label="Public profile slug"
            className="flex-1 px-3 py-2.5 bg-white dark:bg-zinc-900 text-sm font-manrope text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
        {slugError && <p className="font-manrope text-xs text-red-500 dark:text-red-400 mt-1.5">{slugError}</p>}
        <p className="font-manrope text-xs text-zinc-500 mt-1.5">Lowercase letters, numbers, and hyphens only.</p>
      </section>

      {/* Notifications */}
      <section className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-raleway text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" /> Notifications
        </h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <button
            type="button"
            title={notifyOnLicense ? "Disable license notifications" : "Enable license notifications"}
            onClick={() => setNotifyOnLicense((p) => !p)}
            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
              notifyOnLicense ? "bg-fuchsia-600 border-fuchsia-600" : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {notifyOnLicense && <Check className="w-3 h-3 text-white" />}
          </button>
          <div>
            <p className="font-manrope text-sm text-zinc-900 dark:text-white">Email me when a venue licenses my show</p>
            <p className="font-manrope text-xs text-zinc-500 mt-0.5">Sent to your account email address</p>
          </div>
        </label>
      </section>

      {/* Payout */}
      <section className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-raleway text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest mb-2 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Payout Settings
        </h2>
        <p className="font-manrope text-sm text-zinc-600 dark:text-zinc-400 mb-3">
          Manage your bank account or PayPal for royalty payouts.
        </p>
        <Link
          href="/dashboard/artist/earnings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-manrope text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          Manage payout settings →
        </Link>
      </section>

      {/* Save */}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-manrope font-semibold disabled:opacity-50 transition-all"
      >
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Settings"}
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, maxLength, multiline, hint, type,
}: {
  label: string; value: string; onChange: (v: string) => void;
  maxLength?: number; multiline?: boolean; hint?: string; type?: string;
}) {
  const cls = "w-full px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-manrope text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-fuchsia-500 transition-colors";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-manrope text-xs text-zinc-500 uppercase tracking-widest">{label}</label>
      {multiline ? (
        <textarea aria-label={label} title={label} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} rows={3} className={`${cls} resize-none`} />
      ) : (
        <input aria-label={label} title={label} type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} className={cls} />
      )}
      {hint && <p className="font-manrope text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
