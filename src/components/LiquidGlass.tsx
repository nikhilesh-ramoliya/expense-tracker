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
      const pane = document.querySelector(".liquid-nav");
      if (!pane) return;

      if (!navHasLiveLens(pane)) {
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

      if (pane instanceof HTMLElement) pane.style.pointerEvents = "none";
      document.querySelectorAll("canvas[data-liquid-ignore]").forEach((node) => {
        if (node instanceof HTMLElement) {
          node.style.pointerEvents = "none";
          node.style.zIndex = "1";
        }
      });
      const bar = document.querySelector(".bottom-nav");
      if (bar instanceof HTMLElement) bar.style.pointerEvents = "auto";
      document.querySelectorAll(".nav-item").forEach((item) => {
        if (item instanceof HTMLElement) item.style.pointerEvents = "auto";
      });

      liquidGL.registerDynamic(".main-pane");
      renderer()?.captureSnapshot?.();
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
