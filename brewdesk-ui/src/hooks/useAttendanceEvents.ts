"use client";

import { useQuery } from "@tanstack/react-query";
import { getAttendanceEvents, AttendanceEventsParams } from "@/api/attendance";

export const eventKeys = {
  all: ["attendance", "events"] as const,
  list: (params: AttendanceEventsParams) =>
    ["attendance", "events", params] as const,
};

export function useAttendanceEvents(params: AttendanceEventsParams) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => getAttendanceEvents(params),
  });
}
