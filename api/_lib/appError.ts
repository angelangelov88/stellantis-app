// An error with the reply it should give: the router sends it as
// { code, message }. Messages are shown to the user, so never put secrets,
// tokens or another service's raw reply in them.
class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

// The car service (psacc) is down, slow, or replied with something we don't
// understand. Never pass on its raw reply: it can carry tokens or VINs.
const carUnavailable = () =>
  new AppError(
    502,
    "car_unavailable",
    "The car service isn't answering, try again soon",
  );

export { AppError, carUnavailable };
