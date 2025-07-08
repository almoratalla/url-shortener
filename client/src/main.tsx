import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/page";
import RedirectPage from "./pages/RedirectPage";
import CacheStatsPage from "./pages/CacheStatsPage";
import { Toaster } from "./components/ui/sonner";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/cache-stats" element={<CacheStatsPage />} />
                <Route path="/:shortCode" element={<RedirectPage />} />
            </Routes>
            <Toaster />
        </BrowserRouter>
    </StrictMode>
);
