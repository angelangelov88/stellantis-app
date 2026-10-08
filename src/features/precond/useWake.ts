import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../../lib/apiClient";
import useToast from "../../contexts/useToast";
import { SCHEDULES_KEY } from "./useSchedules";
import { STATUS_KEY } from "./useCarStatus";

// How long after the wake to pull a second time. The wake command returns as
// soon as it's dispatched, but the car reports its fresh state over MQTT a
// little later, so one more refetch catches data that the first one missed.
const SETTLE_MS = 20_000;

// Asks the car for a fresh report and refreshes the dashboard. This is a state
// request, not a true wake: an awake car answers with current data, but a
// sleeping car can't be forced awake and keeps its last report. On success it
// invalidates the status and schedule queries straight away and again after the
// car has had a moment to answer, so both pick up anything fresh.
const useWake = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
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
    onError: (error) => {
      showToast(error.message, "error");
    },
  });
};

export { useWake };
