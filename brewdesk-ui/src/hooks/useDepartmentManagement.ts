"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "@/api/attendance";
import {
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from "@/types/attendance";

export const departmentKeys = {
  all: ["attendance", "departments"] as const,
};

function apiMsg(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const e = error as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
}

export function useDepartmentsQuery() {
  return useQuery({ queryKey: departmentKeys.all, queryFn: getDepartments });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateDepartmentRequest) => createDepartment(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success("Department created successfully");
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, "Failed to create department")),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateDepartmentRequest }) =>
      updateDepartment(id, request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success("Department updated successfully");
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, "Failed to update department")),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success("Department deleted");
    },
    onError: (err: unknown) =>
      toast.error(apiMsg(err, "Failed to delete department")),
  });
}
