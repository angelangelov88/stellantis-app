import type { PrecondProgram, PrecondPrograms } from "../types/Api";
import type { PrecondSchedule, PrecondSchedules } from "../types/Precond";

// Maps between the car's wire shape for preconditioning schedules
// (PrecondProgram: day flags, an hour with a 34 "unset" sentinel, an on flag)
// and the UI shape (PrecondSchedule: booleans and a real clock time).

// The car reports hour 34 when a schedule has no departure time set.
const UNSET_HOUR = 34;
// A sensible default to show when a schedule has no time yet.
const DEFAULT_HOUR = 7;

const PROGRAM_KEYS = ["program1", "program2", "program3", "program4"] as const;

const toSchedule = (program: PrecondProgram): PrecondSchedule => ({
  enabled: program.on === 1,
  hour: program.hour >= 0 && program.hour <= 23 ? program.hour : DEFAULT_HOUR,
  minute: program.minute,
  days: program.day.map((d) => d === 1),
});

const toProgram = (schedule: PrecondSchedule): PrecondProgram => ({
  day: schedule.days.map((d): 0 | 1 => (d ? 1 : 0)),
  hour: schedule.hour,
  minute: schedule.minute,
  on: schedule.enabled ? 1 : 0,
});

const toSchedules = (programs: PrecondPrograms): PrecondSchedules =>
  PROGRAM_KEYS.map((key) => toSchedule(programs[key])) as PrecondSchedules;

const toPrograms = (schedules: PrecondSchedules): PrecondPrograms => ({
  program1: toProgram(schedules[0]),
  program2: toProgram(schedules[1]),
  program3: toProgram(schedules[2]),
  program4: toProgram(schedules[3]),
});

// Short weekday labels, Monday first (matching the car's day-flag order).
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const pad2 = (n: number) => String(n).padStart(2, "0");
const formatTime = (schedule: PrecondSchedule) =>
  `${pad2(schedule.hour)}:${pad2(schedule.minute)}`;

export {
  UNSET_HOUR,
  DEFAULT_HOUR,
  WEEKDAYS,
  toSchedule,
  toProgram,
  toSchedules,
  toPrograms,
  formatTime,
};
