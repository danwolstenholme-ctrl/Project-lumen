"use client";

import { createContext, useContext, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

function readInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("lumen-theme") as Theme | null) ?? "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy init reads localStorage on the first client render. The inline
  // <head> script keeps the DOM class in sync before hydration, so no
  // setState-in-effect is needed.
  const [theme, setTheme] = useState<Theme>(readInitial);

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("lumen-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
