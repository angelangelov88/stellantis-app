import type { CarStatus } from "./Api";

// Props for the read-only car status strip.
type CarStatusPanelProps = {
  status: CarStatus | null;
  // True on the first fetch, before any snapshot has arrived.
  loading: boolean;
};

// A single weekly preconditioning schedule in a shape convenient for the UI.
// Converted to/from the car's wire shape (PrecondProgram) at the API boundary.
type PrecondSchedule = {
  enabled: boolean;
  // 24h clock.
  hour: number;
  minute: number;
  // One flag per weekday, Monday first.
  days: boolean[];
};

// The four schedules the car supports, in UI order.
type PrecondSchedules = [
  PrecondSchedule,
  PrecondSchedule,
  PrecondSchedule,
  PrecondSchedule,
];

// Props for one editable schedule row.
type ScheduleRowProps = {
  index: number;
  schedule: PrecondSchedule;
  disabled: boolean;
  onChange: (next: PrecondSchedule) => void;
};

// Props for the panel holding the four schedule rows.
type SchedulePanelProps = {
  disabled: boolean;
};

export type {
  CarStatusPanelProps,
  PrecondSchedule,
  PrecondSchedules,
  ScheduleRowProps,
  SchedulePanelProps,
};
