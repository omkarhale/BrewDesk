"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  updateEmployeeShift,
} from "@/api/attendance";
import { CreateEmployeeRequest, UpdateEmployeeRequest } from "@/types/attendance";

export const employeeKeys = {
  all: ["attendance", "employees"] as const,
};

function apiMsg(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const e = error as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
}

export function useEmployeesQuery() {
  return useQuery({ queryKey: employeeKeys.all, queryFn: getEmployees });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateEmployeeRequest) => createEmployee(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeeKeys.all });
      toast.success("Employee created successfully");
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, "Failed to create employee")),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateEmployeeRequest }) =>
      updateEmployee(id, request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeeKeys.all });
      toast.success("Employee updated successfully");
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, "Failed to update employee")),
  });
}

export function useUpdateEmployeeShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, shiftId }: { employeeId: number; shiftId: number }) =>
      updateEmployeeShift(employeeId, shiftId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeeKeys.all });
      toast.success("Employee shift updated");
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, "Failed to update employee shift")),
  });
}
