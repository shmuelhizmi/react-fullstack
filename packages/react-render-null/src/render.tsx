import React from "react";
import { TinyEmitter } from "tiny-emitter";
import rendererLegacy from "./rendererBackend";

export const RenderBase = (element: JSX.Element) => {
  return rendererLegacy.updateContainer(
    element,
    rendererLegacy.createContainer({}, 0, false, null),
    null,
    () => {}
  );
};

const RenderApp = (props: {
  children: JSX.Element;
  emitter: TinyEmitter;
}): JSX.Element => {
  const [isStopped, setIsStopped] = React.useState(false);
  React.useEffect(() => {
    props.emitter.on("stop", () => setIsStopped(true));
    props.emitter.on("continue", () => setIsStopped(false));
  }, []);
  return isStopped ? <></> : props.children;
};

export const Render = (element: JSX.Element) => {
  const emitter = new TinyEmitter();
  RenderBase(<RenderApp emitter={emitter}>{element}</RenderApp>);
  return {
    stop: () => emitter.emit("stop"),
    continue: () => emitter.emit("continue"),
  };
};
