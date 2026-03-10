"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  List,
  PlusCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { TopBar } from "@/components/layout/top-bar";

interface AppShellProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  prominent?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Log Incident", href: "/log", icon: PlusCircle, prominent: true },
  { label: "History", href: "/incidents", icon: List },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname, mobile = false }: { item: NavItem; pathname: string; mobile?: boolean }) {
  const Icon = item.icon;
  const isActive = isItemActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        item.prominent && !mobile && "bg-teal-50 text-teal-700 hover:bg-teal-100",
        item.prominent && mobile && "-mt-6 rounded-2xl border border-teal-100 bg-teal-500 px-4 py-3 text-white shadow-lg hover:bg-teal-600",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        className={cn(
          "h-5 w-5 transition-transform duration-150 group-hover:scale-105",
          item.prominent && mobile && "h-6 w-6",
        )}
      />
      <span className={cn(mobile && "hidden sm:block")}>{item.label}</span>
      {!mobile && isActive && <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />}
    </Link>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-72 border-r border-slate-200 bg-white/90 p-5 backdrop-blur md:flex md:flex-col">
          <div className="mb-8 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 p-4 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100">ABC Tracker</p>
            <p className="mt-1 text-lg font-semibold">Behavior Log</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col pb-24 md:pb-0">
          <TopBar childName="Avery" />
          <main className="flex-1 p-4 pb-8 md:p-8">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-xl items-end justify-between">
          {navItems.map((item) => (
            <NavLink key={`mobile-${item.href}`} item={item} pathname={pathname} mobile />
          ))}
        </div>
      </nav>
    </div>
  );
}
