import classNames from "classnames";
import type { ScheduleRowProps } from "../../types/Precond";
import { WEEKDAYS } from "../../lib/precondPrograms";

const ScheduleRow = ({
  index,
  schedule,
  disabled,
  onChange,
}: ScheduleRowProps) => {
  const handleEnabled = () => {
    onChange({ ...schedule, enabled: !schedule.enabled });
  };

  const handleTime = (value: string) => {
    const [hour, minute] = value.split(":");
    onChange({ ...schedule, hour: Number(hour), minute: Number(minute) });
  };

  const handleDay = (day: number) => {
    onChange({
      ...schedule,
      days: schedule.days.map((on, i) => (i === day ? !on : on)),
    });
  };

  const timeValue = `${String(schedule.hour).padStart(2, "0")}:${String(
    schedule.minute,
  ).padStart(2, "0")}`;

  return (
    <div className="rounded-xl bg-gray-800 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-strong">
          Schedule {index + 1}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={schedule.enabled}
          aria-label={`Enable schedule ${String(index + 1)}`}
          disabled={disabled}
          onClick={handleEnabled}
          className={classNames(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-40",
            schedule.enabled ? "bg-emerald-400" : "bg-gray-600",
          )}
        >
          <span
            className={classNames(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
              schedule.enabled ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div
        className={classNames("mt-3 space-y-3", {
          "opacity-40": !schedule.enabled,
        })}
      >
        <label className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Departure</span>
          <input
            type="time"
            value={timeValue}
            disabled={disabled}
            onChange={(event) => {
              handleTime(event.target.value);
            }}
            className="rounded-lg bg-gray-900 px-2 py-1 text-strong [color-scheme:dark]"
          />
        </label>

        <div className="flex justify-between gap-1">
          {WEEKDAYS.map((label, day) => (
            <button
              key={label}
              type="button"
              aria-pressed={schedule.days[day]}
              aria-label={label}
              disabled={disabled}
              onClick={() => {
                handleDay(day);
              }}
              className={classNames(
                "h-8 w-8 rounded-full text-xs font-medium transition disabled:opacity-40",
                schedule.days[day]
                  ? "bg-emerald-400 text-gray-900"
                  : "bg-gray-700 text-gray-300",
              )}
            >
              {label[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleRow;
