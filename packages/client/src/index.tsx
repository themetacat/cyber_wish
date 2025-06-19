import "tailwindcss/tailwind.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Providers } from "./Providers";
import { App } from "./App";
// import { Explorer } from "./mud/Explorer";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "./ui/ErrorFallback";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("react-root")!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Providers>
        <BrowserRouter>
          <App />
          {/* <Explorer /> */}
        </BrowserRouter>
      </Providers>
    </ErrorBoundary>
  </StrictMode>,
);
