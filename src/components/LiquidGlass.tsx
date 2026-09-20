"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function prefersReducedTransparency(): boolean {
  return window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LiquidGlass() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedTransparency()) return;

    let cancelled = false;

    void (async () => {
      const liquidGL = (await import("liquid-gl")).default;
      if (cancelled) return;

      if (!(window as Window & { __ledgerLiquidInit?: boolean }).__ledgerLiquidInit) {
        const target = document.querySelector(".liquid-nav");
        if (!target) return;

        liquidGL({
          target: ".liquid-nav",
          snapshot: "html",
          resolution: window.innerWidth < 480 ? 1.1 : 1.5,
          refraction: 0.02,
          aberration: 0.04,
          bevelDepth: 0.08,
          bevelWidth: 0.2,
          frost: 2,
          shadow: true,
          specular: !prefersReducedMotion(),
          reveal: "fade",
          tilt: false,
          magnify: 1,
        });
        liquidGL.registerDynamic(".main-pane");
        (window as Window & { __ledgerLiquidInit?: boolean }).__ledgerLiquidInit = true;
        return;
      }

      liquidGL.registerDynamic(".main-pane");
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
