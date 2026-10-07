import classNames from "classnames";
import { useLogout } from "../auth/useAuth";
import CarStatusPanel from "./CarStatusPanel";
import SchedulePanel from "./SchedulePanel";
import { usePreconditionControl } from "./usePreconditionControl";
import { useWake } from "./useWake";

const STATE_LABEL = { on: "On", off: "Off", unknown: "Unknown" } as const;
const MIN_PRECONDITION_PERCENT = 51;

const PrecondControl = () => {
  const control = usePreconditionControl();
  const wake = useWake();
  const logout = useLogout();

  const wanted = control.target === null ? null : control.target ? "on" : "off";
  const currentState = control.current?.precondition ?? "unknown";
  const battery = control.current?.batteryPercent ?? null;
  const lowBattery = battery !== null && battery < MIN_PRECONDITION_PERCENT;
  // Block while sending, on low battery, and during the first status load —
  // we won't fire a command before we know the car's state and charge.
  const blocked = control.isSending || lowBattery || control.isStatusLoading;

  // While a command is in flight, show the state we asked for; otherwise follow
  // what the car reports.
  const pending = control.isSending || control.confirming;
  const shownOn = pending ? (control.target ?? false) : currentState === "on";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-strong">Mokka Companion</h1>
        <button
          type="button"
          onClick={() => {
            logout.mutate();
          }}
          className="text-sm text-gray-400 underline underline-offset-4"
        >
          Log out
        </button>
      </header>

      <CarStatusPanel
        status={control.current}
        loading={control.isStatusLoading}
        onRefresh={() => {
          wake.mutate();
        }}
        refreshing={wake.isPending}
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-center text-sm font-medium uppercase tracking-wide text-gray-400">
          Preconditioning
        </h2>

        <p className="text-center text-sm text-gray-400">
          Car reports:{" "}
          {control.isStatusLoading ? (
            <span className="text-gray-500">checking…</span>
          ) : (
            <span
              className={classNames("font-semibold", {
                "text-emerald-400": currentState === "on",
                "text-strong": currentState === "off",
                "text-gray-500": currentState === "unknown",
              })}
            >
              {STATE_LABEL[currentState]}
            </span>
          )}
        </p>

        <div className="flex items-center justify-center gap-4">
          <span
            className={classNames("text-sm font-medium", {
              "text-gray-500": shownOn,
              "text-strong": !shownOn,
            })}
          >
            Off
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={shownOn}
            aria-label="Preconditioning"
            disabled={blocked}
            onClick={() => {
              control.send(!shownOn);
            }}
            className={classNames(
              "relative inline-flex h-10 w-[4.5rem] shrink-0 items-center rounded-full transition disabled:opacity-40",
              shownOn ? "bg-emerald-400" : "bg-gray-700",
            )}
          >
            <span
              className={classNames(
                "inline-block h-8 w-8 transform rounded-full bg-white shadow transition",
                shownOn ? "translate-x-9" : "translate-x-1",
              )}
            />
          </button>
          <span
            className={classNames("text-sm font-medium", {
              "text-emerald-400": shownOn,
              "text-gray-500": !shownOn,
            })}
          >
            On
          </span>
        </div>

        {lowBattery && (
          <p className="text-center text-sm text-amber-400">
            Battery is {battery}%. Preconditioning needs at least{" "}
            {MIN_PRECONDITION_PERCENT}% — the car blocks it below that.
          </p>
        )}

        <p role="status" className="min-h-6 text-center text-sm">
          {control.isSending && (
            <span className="text-gray-400">
              Sending to the car… this can take up to ~90s if it's asleep.
            </span>
          )}
          {control.error && (
            <span className="text-red-400">{control.error}</span>
          )}
          {control.confirmed && (
            <span className="text-emerald-400">
              Confirmed: preconditioning is {wanted} ✓
            </span>
          )}
          {control.confirming && (
            <span className="text-gray-400">
              Sent. Confirming with the car…
            </span>
          )}
          {control.timedOut && !control.confirmed && (
            <span className="text-amber-400">
              Sent, but the car hasn't confirmed yet — it may still be waking.
              It now reports {STATE_LABEL[currentState]}.
            </span>
          )}
        </p>
      </section>

      <SchedulePanel disabled={control.isSending} />

      <footer className="mt-auto pt-2 text-center text-xs text-gray-500">
        v{__APP_VERSION__}
      </footer>
    </main>
  );
};

export default PrecondControl;
