import React from "react";
import { TinyEmitter } from "tiny-emitter";
import rendererLegacy, { connectReactDevtools } from "./rendererLegacy";

if (process.env.NODE_ENV === "development") {
  connectReactDevtools(rendererLegacy);
}

export const RenderBase = (element: JSX.Element) => {
  return rendererLegacy.updateContainer(
    element,
    rendererLegacy.createContainer()
  );
};

const RenderApp = (props: {
  children: JSX.Element;
  emitter: TinyEmitter;
}): JSX.Element => {
  const [isStoped, setIsStoped] = React.useState(false);
  React.useEffect(() => {
    props.emitter.on("stop", () => setIsStoped(true));
    props.emitter.on("continue", () => setIsStoped(false));
  }, []);
  return isStoped ? <></> : props.children;
};

export const Render = (element: JSX.Element) => {
  const emitter = new TinyEmitter();
  RenderBase(<RenderApp emitter={emitter}>{element}</RenderApp>);
  return {
    stop: () => emitter.emit("stop"),
    continue: () => emitter.emit("continue"),
  }
};
