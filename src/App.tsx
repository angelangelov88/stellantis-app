import LoginPage from "./features/auth/LoginPage";
import { useMe } from "./features/auth/useAuth";
import PrecondControl from "./features/precond/PrecondControl";

const App = () => {
  const me = useMe();

  if (me.isPending) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </main>
    );
  }

  return me.data?.loggedIn ? <PrecondControl /> : <LoginPage />;
};

export default App;
