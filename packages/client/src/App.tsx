import { Synced } from "./mud/Synced";
import Main from "./components/index";

export function App() {

  return (
    <>
      <div className="fixed inset-0 grid place-items-center p-4">
        <Synced
          fallback={({ message, percentage }) => (
            <div className="tabular-nums">
              {message} ({percentage.toFixed(1)}%)…
            </div>
          )}
        >
          <Main/>
        </Synced>
      </div>
    </>
  );
}
