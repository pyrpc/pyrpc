import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { api } from "./pyrpc";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <api.Provider>
      <App />
    </api.Provider>
  </React.StrictMode>
);
