import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";

import { AppLayout } from "@/components/AppLayout";
import { CardDetail } from "@/pages/CardDetail";
import { HomePage } from "@/pages/HomePage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/card/:id" element={<CardDetail />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
