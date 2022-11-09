import { Views } from "../shared";

export type ViewsToServerComponents<ViewsToTransform extends Views> = {
    [ViewName in keyof ViewsToTransform]: React.FunctionComponent<
      ViewsToTransform[ViewName]["props"]
    >;
  };        