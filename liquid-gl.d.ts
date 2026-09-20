declare module "liquid-gl" {
  const liquidGL: {
    (options?: Record<string, unknown>): unknown;
    registerDynamic: (elements: string | Element | Element[]) => void;
  };
  export default liquidGL;
}
