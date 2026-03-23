"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gavel, Trophy } from "lucide-react";

import { judgeNavItems } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from "@/components/ui/navigation-menu";

export function JudgeHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-radix-gray-a-2 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link href="/projects" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-radix-teal-a-4 text-primary">
            <Gavel className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg font-extrabold tracking-tight">JudgePortal</div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Winter Hack 2026
            </div>
          </div>
        </Link>

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {judgeNavItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild active={active}>
                    <Link
                      href={item.href}
                      className={cn(
                        "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors",
                        active
                          ? "bg-radix-teal-a-4 text-primary"
                          : "text-muted-foreground hover:bg-radix-gray-a-3 hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/results">
              <Trophy className="h-4 w-4" />
              Profile
            </Link>
          </Button>
          <Avatar className="h-11 w-11 border-radix-teal-a-5">
            <AvatarImage
              alt="Judge avatar"
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80"
            />
            <AvatarFallback>RG</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
