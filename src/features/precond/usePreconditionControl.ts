import { useEffect, useState } from "react";
import type { CarStatus, PreconditionState } from "../../types/Api";
import { useCarStatus } from "./useCarStatus";
import { usePrecondition } from "./usePrecondition";

// How long to keep asking the car to confirm a command before giving up. An
// asleep car can take a while to wake, report, and have psacc refresh its cache.
const CONFIRM_TIMEOUT_MS = 120_000;

// Drives the one control: send the command, then poll the car's state until it
// confirms the change (the Growatt pattern — act, then read back).
const usePreconditionControl = () => {
  const command = usePrecondition();
  const [target, setTarget] = useState<boolean | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const desired: PreconditionState | null =
    target === null ? null : target ? "on" : "off";

  // Only poll to confirm once the command was accepted, and until it matches or
  // we time out.
  const confirming = command.isSuccess && !timedOut ? desired : null;
  const status = useCarStatus(confirming);
  const confirmed =
    desired !== null &&
    command.isSuccess &&
    status.data?.precondition === desired;

  useEffect(() => {
    if (!command.isSuccess || target === null || confirmed) return;
    const id = setTimeout(() => {
      setTimedOut(true);
    }, CONFIRM_TIMEOUT_MS);
    return () => {
      clearTimeout(id);
    };
  }, [command.isSuccess, target, confirmed]);

  const send = (on: boolean) => {
    setTimedOut(false);
    setTarget(on);
    command.mutate({ on });
  };

  const current: CarStatus | null = status.data ?? null;

  return {
    send,
    target,
    isSending: command.isPending,
    error: command.isError ? command.error.message : null,
    sent: command.isSuccess,
    confirming: confirming !== null && !confirmed,
    confirmed,
    timedOut,
    current,
    // True only on the first status fetch, before any snapshot has arrived.
    isStatusLoading: status.isLoading,
  };
};

export { usePreconditionControl };
