"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createShift,
  deleteShift,
  getShifts,
  updateShift,
} from "@/api/attendance";
import { CreateShiftRequest, UpdateShiftRequest } from "@/types/attendance";

export const shiftKeys = {
  all: ["attendance", "shifts"] as const,
};

function apiMsg(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const e = error as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
}

export function useShiftsQuery() {
  return useQuery({ queryKey: shiftKeys.all, queryFn: getShifts });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateShiftRequest) => createShift(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftKeys.all });
      toast.success("Shift created successfully");
    },
    onError: (err: unknown) => toast.error(apiMsg(err, "Failed to create shift")),
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateShiftRequest }) =>
      updateShift(id, request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftKeys.all });
      toast.success("Shift updated successfully");
    },
    onError: (err: unknown) => toast.error(apiMsg(err, "Failed to update shift")),
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteShift(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftKeys.all });
      toast.success("Shift deleted");
    },
    onError: (err: unknown) => toast.error(apiMsg(err, "Failed to delete shift")),
  });
}
