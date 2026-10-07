import { useQuery } from "@tanstack/react-query";
import type { PreconditionState, PreconditionStatus } from "../../types/Api";
import { request } from "../../lib/apiClient";

const STATUS_KEY = ["precond-status"];
const POLL_MS = 10_000;

// The car's live preconditioning state. Pass the state we're confirming to poll
// every few seconds until the car reports it, or null to just read once and
// stop. Polling pauses on its own when the tab is hidden.
const usePreconditionStatus = (confirming: PreconditionState | null) =>
  useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => request<PreconditionStatus>("/api/car/status"),
    refetchInterval: (query) =>
      confirming !== null && query.state.data?.state !== confirming
        ? POLL_MS
        : false,
    staleTime: 2000,
  });

export { usePreconditionStatus, STATUS_KEY };
