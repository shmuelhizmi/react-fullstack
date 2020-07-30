import type { ReactNode } from "react";
import rendererLegacy from "./rendererLegacy";

export const Render = (element: ReactNode) => {
  return rendererLegacy.updateContainer(
    element,
    rendererLegacy.createContainer()
  );
};
