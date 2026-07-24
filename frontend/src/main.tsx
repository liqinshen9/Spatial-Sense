import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);

//The React app starts when running Vite (npm run dev). Vite opens a local web page at localhost:5173
//That page loads the React code from main.tsx, which mounts the main component - App.tsx
//Wrapped the React app with Redux Provider in main.tsx, so components can access the store.

