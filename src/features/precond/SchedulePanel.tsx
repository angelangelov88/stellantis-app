import { useState } from "react";
import type {
  PrecondSchedule,
  PrecondSchedules,
  SchedulePanelProps,
} from "../../types/Precond";
import { toPrograms, toSchedules } from "../../lib/precondPrograms";
import { useSaveSchedules, useSchedules } from "./useSchedules";
import ScheduleRow from "./ScheduleRow";

const SchedulePanel = ({ disabled }: SchedulePanelProps) => {
  const query = useSchedules();
  const save = useSaveSchedules();
  const [draft, setDraft] = useState<PrecondSchedules | null>(null);

  const loaded = query.data ? toSchedules(query.data) : null;

  // Seed the editable draft from the car's schedules once they arrive, by
  // adjusting state during render (React re-renders before committing). We
  // don't re-seed afterwards, so in-progress edits are never overwritten; a
  // save primes the cache to match the draft, keeping them in sync.
  if (loaded && draft === null) {
    setDraft(loaded);
  }

  const updateRow = (index: number) => (next: PrecondSchedule) => {
    setDraft(
      (current) =>
        current?.map((row, i) =>
          i === index ? next : row,
        ) as PrecondSchedules,
    );
  };

  const dirty =
    draft !== null && loaded !== null && !sameSchedules(draft, loaded);

  const rowsDisabled = disabled || save.isPending;

  if (query.isLoading) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-400">
          Schedules
        </h2>
        <div className="h-24 animate-pulse rounded-xl bg-gray-800" />
      </section>
    );
  }

  if (query.isError || draft === null) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-400">
          Schedules
        </h2>
        <p className="text-sm text-gray-500">
          Schedules aren&apos;t available right now.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-gray-400">
        Schedules
      </h2>

      {draft.map((schedule, index) => (
        <ScheduleRow
          key={index}
          index={index}
          schedule={schedule}
          disabled={rowsDisabled}
          onChange={updateRow(index)}
        />
      ))}

      <div className="flex items-center justify-between">
        <p role="status" className="text-sm">
          {save.isPending && <span className="text-gray-400">Saving…</span>}
          {save.isError && (
            <span className="text-red-400">{save.error.message}</span>
          )}
          {save.isSuccess && !dirty && (
            <span className="text-emerald-400">Saved ✓</span>
          )}
        </p>
        <button
          type="button"
          disabled={!dirty || rowsDisabled}
          onClick={() => {
            save.mutate(toPrograms(draft));
          }}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-gray-900 transition disabled:opacity-40"
        >
          Save schedules
        </button>
      </div>
    </section>
  );
};

const sameSchedules = (a: PrecondSchedules, b: PrecondSchedules) =>
  JSON.stringify(a) === JSON.stringify(b);

export default SchedulePanel;
