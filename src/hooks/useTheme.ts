import { useState, useEffect } from "react";

type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";

  try {
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch (e) {
    console.warn("Error accessing localStorage:", e);
  }

  return "dark";
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    try {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
      window.localStorage.setItem("theme", theme);
    } catch (e) {
      console.warn("Error updating theme:", e);
    }
  }, [theme, isMounted]);

  const toggleTheme = () => {
    if (!isMounted) return;
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme, isMounted };
}
