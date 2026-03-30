import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { DarkModeContextProvider } from "./context/DarkMode";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./components/navbar/them.scss"; // 👈 مهم

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <DarkModeContextProvider>
        <App />
      </DarkModeContextProvider>
    </QueryClientProvider>
  </BrowserRouter>,
);
