import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PreconditionBody, PreconditionResult } from "../../types/Api";
import { request } from "../../lib/apiClient";
import { STATUS_KEY } from "./useCarStatus";

// The one update call: turn preconditioning on or off. On success it refreshes
// the status query so the UI starts confirming against the car at once.
const usePrecondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PreconditionBody) =>
      request<PreconditionResult>("/api/car/precondition", {
        method: "POST",
        body,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STATUS_KEY }),
  });
};

export { usePrecondition };
