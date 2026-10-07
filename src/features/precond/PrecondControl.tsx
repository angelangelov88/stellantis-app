import classNames from "classnames";
import { useLogout } from "../auth/useAuth";
import { usePreconditionControl } from "./usePreconditionControl";

const STATE_LABEL = { on: "On", off: "Off", unknown: "Unknown" } as const;

const PrecondControl = () => {
  const control = usePreconditionControl();
  const logout = useLogout();

  const wanted = control.target === null ? null : control.target ? "on" : "off";
  const currentState = control.current?.state ?? "unknown";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-4 py-6">
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

      <section className="flex flex-1 flex-col justify-center gap-4">
        <h2 className="text-center text-sm font-medium uppercase tracking-wide text-gray-400">
          Preconditioning
        </h2>

        <p className="text-center text-sm text-gray-400">
          Car reports:{" "}
          <span
            className={classNames("font-semibold", {
              "text-emerald-400": currentState === "on",
              "text-strong": currentState === "off",
              "text-gray-500": currentState === "unknown",
            })}
          >
            {STATE_LABEL[currentState]}
          </span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={control.isSending}
            onClick={() => {
              control.send(true);
            }}
            className="rounded-2xl bg-emerald-400 px-4 py-6 text-lg font-semibold text-gray-950 transition disabled:opacity-40"
          >
            Turn on
          </button>
          <button
            type="button"
            disabled={control.isSending}
            onClick={() => {
              control.send(false);
            }}
            className="rounded-2xl bg-gray-800 px-4 py-6 text-lg font-semibold text-strong transition disabled:opacity-40"
          >
            Turn off
          </button>
        </div>

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

      <footer className="pt-6 text-center text-xs text-gray-500">
        v{__APP_VERSION__}
      </footer>
    </main>
  );
};

export default PrecondControl;
