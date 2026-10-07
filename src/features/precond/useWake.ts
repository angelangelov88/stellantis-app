import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../../lib/apiClient";
import { SCHEDULES_KEY } from "./useSchedules";
import { STATUS_KEY } from "./useCarStatus";

// How long after the wake to pull a second time. The wake command returns as
// soon as it's dispatched, but the car reports its fresh state over MQTT a
// little later, so one more refetch catches data that the first one missed.
const SETTLE_MS = 20_000;

// Wakes the car and refreshes the dashboard. On success it invalidates the
// status and schedule queries straight away and again after the car has had a
// moment to report, so both pick up the fresh snapshot.
const useWake = () => {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    void queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
  };
  return useMutation({
    mutationFn: () =>
      request<{ status: string }>("/api/car/wake", { method: "POST" }),
    onSuccess: () => {
      refresh();
      setTimeout(refresh, SETTLE_MS);
    },
  });
};

export { useWake };
