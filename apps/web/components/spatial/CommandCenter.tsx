"use client";

import { useEffect, useState } from "react";

import { CabinetBootScreen } from "@/components/clinical/CabinetBootScreen";
import { NosologyHome } from "@/components/home/NosologyHome";
import { WelcomeScreen } from "@/components/home/WelcomeScreen";

const WELCOME_KEY = "sonogyn-home-entered";

export function CommandCenter() {
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const seen = window.sessionStorage.getItem(WELCOME_KEY) === "1";
    setEntered(seen || params.has("hub"));
    setReady(true);
  }, []);

  function start() {
    window.sessionStorage.setItem(WELCOME_KEY, "1");
    setEntered(true);
  }

  if (!ready) return <CabinetBootScreen />;
  if (!entered) return <WelcomeScreen onStart={start} />;
  return <NosologyHome />;
}
