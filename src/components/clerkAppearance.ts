import { dark } from "@clerk/themes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const clerkAppearance: any = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#D946EF",
    colorBackground: "transparent",
    colorInputBackground: "rgba(255,255,255,0.06)",
    colorInputText: "#F4F4F5",
    colorText: "#F4F4F5",
    colorTextSecondary: "#A1A1AA",
    colorNeutral: "#71717A",
    borderRadius: "0.375rem",
    fontFamily: "var(--font-manrope), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-raleway), system-ui, sans-serif",
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "w-full",
    card: "shadow-none bg-transparent border-0 p-0",
    cardBox: "bg-transparent border-0 shadow-none",
    headerTitle:
      "font-[family-name:var(--font-raleway)] tracking-wide text-white",
    headerSubtitle: "text-zinc-400",
    socialButtonsBlockButton:
      "border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors",
    socialButtonsBlockButtonText: "font-medium",
    dividerLine: "bg-zinc-700",
    dividerText: "text-zinc-500 text-xs tracking-widest uppercase",
    formFieldLabel: "text-zinc-400 text-sm tracking-wide",
    formFieldInput:
      "bg-zinc-800 border border-zinc-700 text-zinc-100 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors placeholder:text-zinc-600",
    formButtonPrimary:
      "bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:opacity-90 text-white font-semibold tracking-wide transition-opacity shadow-[0_0_20px_rgba(217,70,239,0.30)]",
    footerActionLink:
      "text-fuchsia-400 hover:text-purple-400 transition-colors",
    identityPreviewText: "text-zinc-100",
    identityPreviewEditButton: "text-fuchsia-400",
    alertText: "text-sm",
    formResendCodeLink: "text-fuchsia-400",
  },
};
