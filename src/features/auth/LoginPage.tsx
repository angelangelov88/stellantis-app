import { useState } from "react";
import { useLogin } from "./useAuth";

const LoginPage = () => {
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password) login.mutate({ password });
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-strong">Mokka Companion</h1>
        <p className="mt-1 text-sm text-gray-400">
          Enter the app password to continue
        </p>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="password" className="sr-only">
          App password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-strong outline-none focus:border-violet-400"
          placeholder="Password"
        />
        <button
          type="submit"
          disabled={!password || login.isPending}
          className="rounded-xl bg-violet-400 px-4 py-3 font-medium text-gray-950 disabled:opacity-40"
        >
          {login.isPending ? "Checking…" : "Log in"}
        </button>
        {login.isError && (
          <p role="alert" className="text-center text-sm text-red-400">
            {login.error.message}
          </p>
        )}
      </form>
    </main>
  );
};

export default LoginPage;
