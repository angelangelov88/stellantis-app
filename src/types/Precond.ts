import type { CarStatus } from "./Api";

// Props for the read-only car status strip.
type CarStatusPanelProps = {
  status: CarStatus | null;
  // True on the first fetch, before any snapshot has arrived.
  loading: boolean;
};

export type { CarStatusPanelProps };
