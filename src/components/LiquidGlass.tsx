"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type LiquidRenderer = {
  lenses?: { el?: Element }[];
  captureSnapshot?: () => void;
};

function prefersReducedTransparency(): boolean {
  return window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function renderer(): LiquidRenderer | undefined {
  return (window as Window & { __liquidGLRenderer__?: LiquidRenderer }).__liquidGLRenderer__;
}

function pruneDeadLenses() {
  const gl = renderer();
  if (!gl?.lenses) return;
  gl.lenses = gl.lenses.filter((lens) => Boolean(lens.el?.isConnected));
}

function navHasLiveLens(nav: Element): boolean {
  return Boolean(renderer()?.lenses?.some((lens) => lens.el === nav && nav.isConnected));
}

export function LiquidGlass() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedTransparency()) return;

    let cancelled = false;

    void (async () => {
      const liquidGL = (await import("liquid-gl")).default;
      if (cancelled) return;

      pruneDeadLenses();
      const nav = document.querySelector(".liquid-nav");
      if (!nav) return;

      if (!navHasLiveLens(nav)) {
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
      }

      liquidGL.registerDynamic(".main-pane");
      renderer()?.captureSnapshot?.();
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
