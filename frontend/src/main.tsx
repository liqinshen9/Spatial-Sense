import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

//The React app starts when running Vite (npm run dev). Vite opens a local web page at localhost:5173
//That page loads the React code from main.tsx, which mounts the main component - App.tsx

