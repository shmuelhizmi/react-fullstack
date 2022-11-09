import Reaxt from "react";
import { TransformViewProps } from "./types";
import { View as ViewType } from "../shared";

abstract class Component<
  View extends ViewType<any>,
  State = {},
  ExternalProps = {},
> extends Reaxt.Component<TransformViewProps<View["props"]> & ExternalProps, State> { }

export default Component;
