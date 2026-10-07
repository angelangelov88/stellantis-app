import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PrecondPrograms } from "../../types/Api";
import { request } from "../../lib/apiClient";

const SCHEDULES_KEY = ["car-schedules"];

// Reads the car's four weekly preconditioning schedules. These change rarely,
// so a long staleTime and no polling.
const useSchedules = () =>
  useQuery({
    queryKey: SCHEDULES_KEY,
    queryFn: () => request<PrecondPrograms>("/api/car/schedules"),
    staleTime: 60_000,
  });

// Writes the schedules back to the car. psacc returns the saved set, which we
// prime into the cache so the editor and server agree without a refetch.
const useSaveSchedules = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (programs: PrecondPrograms) =>
      request<PrecondPrograms>("/api/car/schedules", {
        method: "PUT",
        body: programs,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(SCHEDULES_KEY, data);
    },
  });
};

export { useSchedules, useSaveSchedules, SCHEDULES_KEY };
