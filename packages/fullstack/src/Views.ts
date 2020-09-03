import React from "react";
import Component from "./component/Component";

export type Views = Record<string, View<any>>;

export type View<Props extends Record<string, any>> = {
  props: Props;
};

export type ViewsToComponents<ViewsToTransform extends Views> = {
  [ViewName in keyof ViewsToTransform]: new (
    props:
      | React.ComponentClass<ViewsToTransform[ViewName]["props"]>
      | React.FunctionComponent<ViewsToTransform[ViewName]["props"]>
  ) => Component<ViewsToTransform[ViewName], any, any>;
};

export type ViewsToServerComponents<ViewsToTransform extends Views> = {
  [ViewName in keyof ViewsToTransform]: React.FunctionComponent<
    ViewsToTransform[ViewName]["props"]
  >;
};

export type TransformViewProps<Props extends Record<string, any>> = {
  [Key in keyof Props]: MapResultToPromise<Props[Key]>;
};

type MapResultToPromise<T> = T extends (...args: infer U) => infer R
  ? R extends Promise<any>
    ? (...args: U) => R
    : (...args: U) => Promise<R>
  : T;
