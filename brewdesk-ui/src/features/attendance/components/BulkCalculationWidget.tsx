"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Loader2, Play, SkipForward } from "lucide-react";
import { bulkCalculateAttendance } from "@/api/attendance";
import { BulkCalculationResponse } from "@/types/attendance";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function today() { return new Date().toISOString().split("T")[0]; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }

export function BulkCalculationWidget() {
  const [dateFrom, setDateFrom] = useState(daysAgo(30));
  const [dateTo, setDateTo] = useState(today());
  const [employeeCode, setEmployeeCode] = useState("");
  const [result, setResult] = useState<BulkCalculationResponse | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const mutation = useMutation({
    mutationFn: bulkCalculateAttendance,
    onSuccess: (data) => { setResult(data); setShowErrors(false); },
  });

  const run = () => {
    setResult(null);
    mutation.mutate({ dateFrom, dateTo, employeeCode: employeeCode.trim() || undefined });
  };

  return (
    <div className="card-flat overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground" style={{fontFamily:"var(--font-display)"}}>Bulk Recalculate</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">Recalculate attendance for all active employees over a date range.</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-from" className="text-[12px]">From Date</Label>
            <Input id="bulk-from" type="date" value={dateFrom} max={dateTo} onChange={(e) => setDateFrom(e.target.value)} className="text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bulk-to" className="text-[12px]">To Date</Label>
            <Input id="bulk-to" type="date" value={dateTo} min={dateFrom} max={today()} onChange={(e) => setDateTo(e.target.value)} className="text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bulk-emp" className="text-[12px]">Employee Code <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="bulk-emp" placeholder="All active employees" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} className="text-[13px]" />
          </div>
        </div>

        <Button onClick={run} disabled={mutation.isPending} className="gap-1.5 h-8 text-[13px]">
          {mutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Running...</> : <><Play className="h-3.5 w-3.5" />Run Calculation</>}
        </Button>

        {mutation.isPending && (
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
            Processing dates — this may take a moment for large ranges...
          </div>
        )}

        {result && !mutation.isPending && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatChip icon={<CheckCircle2 className="h-4 w-4 text-teal-600" />} label="Successful" value={result.successCount} color="teal" />
              <StatChip icon={<AlertCircle className="h-4 w-4 text-red-500" />} label="Errors" value={result.errorCount} color="red" />
              <StatChip icon={<SkipForward className="h-4 w-4 text-amber-500" />} label="Skipped" value={result.skippedCount} color="amber" />
              <StatChip icon={null} label="Employees" value={result.totalEmployees} color="slate" />
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border border-red-100 dark:border-red-900/30 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowErrors((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-900/10 text-[12px] font-medium text-red-700 dark:text-red-400"
                >
                  <span>{result.errors.length} error{result.errors.length !== 1 ? "s" : ""}</span>
                  {showErrors ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {showErrors && (
                  <ul className="px-3 py-2 space-y-1 max-h-48 overflow-y-auto bg-white dark:bg-card">
                    {result.errors.map((e, i) => (
                      <li key={i} className="font-mono text-[11px] text-red-600 dark:text-red-400">{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const bg: Record<string, string> = { teal: "bg-teal-50 dark:bg-teal-900/10", red: "bg-red-50 dark:bg-red-900/10", amber: "bg-amber-50 dark:bg-amber-900/10", slate: "bg-slate-50 dark:bg-slate-900/20" };
  return (
    <div className={cn("rounded-lg px-3 py-2.5 flex items-center gap-2", bg[color] ?? bg.slate)}>
      {icon}
      <div>
        <p className="text-[18px] font-semibold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}
