import Reaxt from "react";
import { TransformViewProps, View as ViewType } from "../Views";

abstract class Component<
  View extends ViewType<any>,
  State = {},
  ExternalProps = {},
> extends Reaxt.Component<TransformViewProps<View["props"]> & ExternalProps, State> {}

export default Component;
