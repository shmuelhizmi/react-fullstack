import Reaxt from "react";
import { TransformViewProps, View as ViewType } from "../Views";

abstract class Component<
  View extends ViewType<any>,
  State = {}
> extends Reaxt.Component<TransformViewProps<View["props"]>, State> {}

export default Component;
