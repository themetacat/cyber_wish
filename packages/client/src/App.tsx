import { Synced } from "./mud/Synced";
import Main from "./components/index";
import { getBNBUSDPrice } from "./utils/common";

export function App() {
  getBNBUSDPrice();
  return (
    <>
      <div className="fixed inset-0 grid place-items-center p-4 bg-[url('/images/wishWall/BG.webp')] bg-cover bg-no-repeat bg-center">
        <Synced
          fallback={({ message, percentage }) => (
            <div className="tabular-nums font-['FSKim-Medium'] text-[#F8E49C]">
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
