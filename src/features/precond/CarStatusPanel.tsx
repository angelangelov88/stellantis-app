import classNames from "classnames";
import type { CarStatusPanelProps } from "../../types/Precond";
import { relativeTime } from "../../lib/relativeTime";

const MIN_PRECONDITION_PERCENT = 51;

const CarStatusPanel = ({
  status,
  loading,
  onRefresh,
  refreshing,
}: CarStatusPanelProps) => {
  const battery = status?.batteryPercent ?? null;
  const lowBattery = battery !== null && battery < MIN_PRECONDITION_PERCENT;

  const charge = status?.charging;
  const chargeLabel = !charge
    ? "—"
    : !charge.plugged
      ? "Unplugged"
      : charge.charging
        ? "Charging"
        : "Plugged in";

  const rows = [
    {
      label: "Battery",
      value: battery !== null ? `${String(battery)}%` : "—",
      warn: lowBattery,
    },
    {
      label: "Range",
      value:
        status?.rangeKm != null
          ? `${String(Math.round(status.rangeKm))} km`
          : "—",
      warn: false,
    },
    { label: "Charging", value: chargeLabel, warn: false },
    {
      label: "Outside",
      value:
        status?.outsideTempC != null ? `${String(status.outsideTempC)}°C` : "—",
      warn: false,
    },
    {
      label: "Odometer",
      value:
        status?.odometerKm != null
          ? `${Math.round(status.odometerKm).toLocaleString()} km`
          : "—",
      warn: false,
    },
  ];

  const updated = relativeTime(status?.updatedAt ?? null);
  const location = status?.location ?? null;

  return (
    <div className="rounded-2xl bg-gray-900 p-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <dt className="text-gray-400">{row.label}</dt>
            {loading ? (
              <dd
                aria-hidden
                className="h-4 w-12 animate-pulse rounded bg-gray-700"
              />
            ) : (
              <dd
                className={classNames("font-semibold", {
                  "text-red-400": row.warn,
                  "text-strong": !row.warn,
                })}
              >
                {row.value}
              </dd>
            )}
          </div>
        ))}
      </dl>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        {loading ? (
          <span className="h-3 w-24 animate-pulse rounded bg-gray-700" />
        ) : location ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${String(location.lat)},${String(location.lon)}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            View on map
          </a>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <span>{updated ? `Updated ${updated}` : ""}</span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title="Pulls the car's latest report. A sleeping car can't be forced awake, so this may keep showing the last report until the car next wakes."
            className="underline underline-offset-4 disabled:opacity-40"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarStatusPanel;
