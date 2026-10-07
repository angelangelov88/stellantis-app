import type { CarStatus } from "./Api";

// Props for the read-only car status strip.
type CarStatusPanelProps = {
  status: CarStatus | null;
};

export type { CarStatusPanelProps };
