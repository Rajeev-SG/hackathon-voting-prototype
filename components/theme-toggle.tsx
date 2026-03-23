"use client";

import * as React from "react";
import { MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem("hackathon-theme");
    const nextIsDark = storedTheme ? storedTheme === "dark" : true;
    document.documentElement.classList.toggle("dark", nextIsDark);
    setIsDark(nextIsDark);
    setMounted(true);
  }, []);

  const handleToggle = React.useCallback(() => {
    setIsDark((current) => {
      const nextValue = !current;
      document.documentElement.classList.toggle("dark", nextValue);
      window.localStorage.setItem("hackathon-theme", nextValue ? "dark" : "light");
      console.log("Theme toggled", nextValue ? "dark" : "light");
      return nextValue;
    });
  }, []);

  return (
    <Button
      aria-label="Toggle theme"
      size="icon"
      variant="ghost"
      className="rounded-2xl border border-border bg-radix-gray-a-2"
      onClick={handleToggle}
    >
      {mounted && !isDark ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
    </Button>
  );
}
