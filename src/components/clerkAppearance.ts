export const clerkAppearance: any = {
  variables: {
    colorPrimary: "#D946EF",
    colorBackground: "#ffffff",
    colorInputBackground: "#f9f9fb",
    colorInputText: "#09090B",
    colorText: "#09090B",
    colorTextSecondary: "#71717A",
    colorNeutral: "#A1A1AA",
    borderRadius: "0.375rem",
    fontFamily: "var(--font-manrope), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-raleway), system-ui, sans-serif",
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "w-full",
    card: "shadow-none bg-transparent border-0 p-0",
    cardBox: "bg-transparent border-0 shadow-none",
    headerTitle: "font-[family-name:var(--font-raleway)] tracking-wide text-zinc-900",
    headerSubtitle: "text-zinc-500",
    socialButtonsBlockButton:
      "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 transition-colors shadow-sm",
    socialButtonsBlockButtonText: "font-medium",
    dividerLine: "bg-zinc-200",
    dividerText: "text-zinc-400 text-xs tracking-widest uppercase",
    formFieldLabel: "text-zinc-600 text-sm tracking-wide",
    formFieldInput:
      "bg-zinc-50 border border-zinc-200 text-zinc-900 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors placeholder:text-zinc-400",
    formButtonPrimary:
      "bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:opacity-90 text-white font-semibold tracking-wide transition-opacity shadow-[0_0_20px_rgba(217,70,239,0.25)]",
    footerActionLink: "text-fuchsia-600 hover:text-purple-600 transition-colors",
    identityPreviewText: "text-zinc-900",
    identityPreviewEditButton: "text-fuchsia-600",
    alertText: "text-sm",
    formResendCodeLink: "text-fuchsia-600",
  },
};
