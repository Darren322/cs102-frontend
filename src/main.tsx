import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Toaster } from "sonner";  // ✅ import

 // if using Tailwind
import "./App.css" 
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App/>
      <Toaster
      position="top-right"
      richColors
      toastOptions={{
        duration: 3000,
        style: { background: "#0f172a", color: "#f8fafc" },
      }}
    />
    </BrowserRouter>
  </React.StrictMode>
);
