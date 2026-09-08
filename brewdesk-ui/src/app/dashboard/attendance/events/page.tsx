"use client";
import { useState } from "react";
import { Activity, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAttendanceEvents } from "@/hooks/useAttendanceEvents";
import { isManagement } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function today() { return new Date().toISOString().split("T")[0]; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }

function fmtTime(s: string) {
  return new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

const SOURCE_COLORS: Record<string, string> = {
  WEB: "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
  FACE: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  FINGERPRINT: "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  RFID_CARD: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  MOBILE: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  ADMIN: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  API: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const TH = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th className={cn("px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap", className)}>{children}</th>
);

export default function EventsPage() {
  const { user } = useAuth();
  const isAdmin = isManagement(user?.role);
  const [empCode, setEmpCode] = useState("");
  const [dateFrom, setDateFrom] = useState(daysAgo(7));
  const [dateTo, setDateTo] = useState(today());
  const [page, setPage] = useState(0);

  const [committed, setCommitted] = useState({ employeeCode: "", dateFrom: daysAgo(7), dateTo: today(), page: 0 });
  const { data, isLoading, isFetching } = useAttendanceEvents({ ...committed, size: 50 });

  const search = (p = 0) => { setPage(p); setCommitted({ employeeCode: empCode.trim(), dateFrom, dateTo, page: p }); };
  const clear = () => { setEmpCode(""); setDateFrom(daysAgo(7)); setDateTo(today()); setPage(0); setCommitted({ employeeCode: "", dateFrom: daysAgo(7), dateTo: today(), page: 0 }); };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
        <Activity className="h-7 w-7 text-red-500" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">Access denied</h3>
      <p className="text-sm text-muted-foreground">You don&apos;t have permission to view punch events.</p>
    </div>
  );

  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.pageNumber ?? 0;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-[22px] font-semibold text-foreground tracking-tight" style={{fontFamily:"var(--font-display)"}}>Punch Events</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">Raw audit log of every punch event recorded from any source.</p>
      </div>

      {/* Filters */}
      <div className="card-flat p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-emp" className="text-[12px]">Employee Code</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input id="ev-emp" className="pl-8 text-[13px]" placeholder="e.g. EMP001" value={empCode} onChange={e => setEmpCode(e.target.value)} onKeyDown={e => e.key === "Enter" && search(0)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-from" className="text-[12px]">From</Label>
            <Input id="ev-from" type="date" value={dateFrom} max={dateTo} onChange={e => setDateFrom(e.target.value)} className="text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-to" className="text-[12px]">To</Label>
            <Input id="ev-to" type="date" value={dateTo} min={dateFrom} max={today()} onChange={e => setDateTo(e.target.value)} className="text-[13px]" />
          </div>
          <div className="flex items-end gap-2">
            <Button size="sm" onClick={() => search(0)} disabled={isFetching} className="gap-1.5 flex-1">
              <Search className="h-3.5 w-3.5" />Search
            </Button>
            <Button size="sm" variant="outline" onClick={clear} disabled={isFetching}><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        {!isLoading && total > 0 && <p className="text-[12px] text-muted-foreground">{total.toLocaleString()} events found</p>}
      </div>

      {/* Table */}
      <div className={cn("card-flat overflow-hidden transition-opacity", isFetching && !isLoading ? "opacity-60" : "")}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header-rippling">
                <TH>Employee</TH><TH>Event Time</TH><TH>Source</TH><TH className="hidden sm:table-cell">Type</TH><TH className="hidden lg:table-cell">External ID</TH><TH className="hidden md:table-cell">Created</TH>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length:8}).map((_,i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20"/></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-36"/></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full"/></td>
                  <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-14"/></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-32"/></td>
                  <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-32"/></td>
                </tr>
              )) : !data?.content?.length ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-muted-foreground">No events found for the selected filters.</td></tr>
              ) : data.content.map(ev => (
                <tr key={ev.id} className="border-t border-border hover:bg-[hsl(220_20%_97%)] dark:hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5"><span className="font-mono text-[12px] font-semibold">{ev.employeeCode}</span></td>
                  <td className="px-4 py-2.5 text-[13px]">{fmtTime(ev.eventTime)}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", SOURCE_COLORS[ev.source] ?? "bg-slate-100 text-slate-600")}>
                      {ev.source}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-[12px] text-muted-foreground">{ev.eventType}</td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    {ev.externalEventId ? <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[200px] block">{ev.externalEventId}</span> : <span className="text-muted-foreground/30">—</span>}
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-[12px] text-muted-foreground">{fmtTime(ev.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[12px] text-muted-foreground">Page {currentPage + 1} of {totalPages} &bull; {total.toLocaleString()} total</p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => search(currentPage - 1)} disabled={data?.first || isFetching}><ChevronLeft className="h-4 w-4" />Prev</Button>
            <Button variant="outline" size="sm" onClick={() => search(currentPage + 1)} disabled={data?.last || isFetching}>Next<ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
