import React from "react";
import rendererLegacy from "./rendererLegacy";

export const Render = (element: React.ReactNode) => {
  return rendererLegacy.updateContainer(
    element,
    rendererLegacy.createContainer()
  );
};
