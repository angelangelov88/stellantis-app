import { useQuery } from "@tanstack/react-query";
import type { CarStatus, PreconditionState } from "../../types/Api";
import { request } from "../../lib/apiClient";

const STATUS_KEY = ["car-status"];
const POLL_MS = 10_000;

// The car's live snapshot. Pass the preconditioning state we're confirming to
// poll every few seconds until the car reports it, or null to just read once
// and stop. Polling pauses on its own when the tab is hidden.
const useCarStatus = (confirming: PreconditionState | null) =>
  useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => request<CarStatus>("/api/car/status"),
    refetchInterval: (query) =>
      confirming !== null && query.state.data?.precondition !== confirming
        ? POLL_MS
        : false,
    staleTime: 2000,
  });

export { useCarStatus, STATUS_KEY };
