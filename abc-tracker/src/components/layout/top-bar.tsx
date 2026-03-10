"use client";

import Link from "next/link";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";

interface TopBarProps {
  childName: string;
}

export function TopBar({ childName }: TopBarProps) {
  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 p-4 md:px-8 md:py-5">
        <div>
          <p className="text-sm text-slate-500">{today}</p>
          <h1 className="text-lg font-semibold text-slate-900 md:text-2xl">{childName}&apos;s ABC Tracker</h1>
        </div>

        <Link
          href="/log"
          className="hidden h-11 items-center gap-2 rounded-xl bg-teal-500 px-5 text-sm font-medium text-white transition hover:bg-teal-600 md:inline-flex"
        >
          <PlusCircle className="h-5 w-5" />
          Quick Log
        </Link>
      </div>

      <Link
        href="/log"
        aria-label="Quick log incident"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg transition hover:bg-teal-600 md:hidden"
      >
        <PlusCircle className="h-6 w-6" />
      </Link>
    </header>
  );
}
