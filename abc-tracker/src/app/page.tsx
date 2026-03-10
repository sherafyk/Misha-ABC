import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const quickActions = [
  {
    title: "Log Incident",
    description: "Capture an ABC event quickly.",
    href: "/log",
    icon: ClipboardList,
  },
  {
    title: "View History",
    description: "Review recent incident details.",
    href: "/incidents",
    icon: FileText,
  },
  {
    title: "AI Notes",
    description: "Convert notes into clinical language.",
    href: "/ai-notes",
    icon: Sparkles,
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-medium text-teal-600">Welcome back</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Your child&apos;s behavior dashboard is ready.
        </h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Start with a quick incident log or browse recent data. The layout is optimized for fast, calm data entry on mobile.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="h-full rounded-xl border-slate-200 bg-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center text-sm font-medium text-blue-700">
                  Open
                  <ArrowRight className="ml-2 h-4 w-4" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
