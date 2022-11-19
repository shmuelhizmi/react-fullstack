import React from "react";
import { Views } from "../shared";



export type ViewsToComponents<ViewsToTransform extends Views> = {
  [ViewName in keyof ViewsToTransform]:
    | React.ComponentClass<TransformViewProps<ViewsToTransform[ViewName]["props"]>>
    | React.FunctionComponent<TransformViewProps<ViewsToTransform[ViewName]["props"]>>;
};



export type TransformViewProps<Props extends Record<string, any>> = {
  [Key in keyof Props]: MapResultToPromise<Props[Key]>;
};

type MapResultToPromise<T> = T extends (...args: infer U) => infer R
  ? R extends Promise<any>
    ? (...args: U) => R
    : (...args: U) => Promise<R>
  : T;
