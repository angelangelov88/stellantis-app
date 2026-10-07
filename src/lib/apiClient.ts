import type { ApiError } from "../types/Api";

// A thin wrapper over fetch for the app's own /api. It sends and receives
// JSON, keeps the session cookie, and turns an error reply into a thrown
// ApiRequestError carrying the server's code and safe message.

class ApiRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const hasBody = options.body !== undefined;
  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    credentials: "same-origin",
  });
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // No body, or not JSON.
  }
  if (!res.ok) {
    const error = (data ?? {}) as Partial<ApiError>;
    throw new ApiRequestError(
      error.code ?? "error",
      error.message ?? "Something went wrong",
      res.status,
    );
  }
  return data as T;
};

export { ApiRequestError, request };
