import React from "react";
import { randomId } from "../shared";
import App from "./App";
import { AppContext } from "./contexts";

const ViewParentContext = React.createContext<
  { uid: string; childIndex: number } | undefined
>(undefined);

class ViewComponent<
  Props extends React.PropsWithChildren<{ name: string; props: any }>
> extends React.Component<Props> {
  static contextType = AppContext;
  declare context: App;
  private uid = randomId();
  private mountState: "premounted" | "mounted" | "unmounted" = "premounted";
  componentDidMount() {
    this.mountState = "mounted";
    this.forceUpdate();
  }
  componentWillUnmount() {
    this.mountState = "unmounted";
    this.context.deleteRunningView(this.uid);
  }
  render() {
    return (
      <AppContext.Consumer>
        {(app) => {
          if (!app || this.mountState !== "mounted") {
            return <> </>;
          }
          return (
            <ViewParentContext.Consumer>
              {(parent) => {
                app.updateRunningView({
                  parentUid: parent?.uid || "",
                  isRoot: parent === undefined,
                  childIndex: parent?.childIndex || 0,
                  name: this.props.name,
                  props: this.props.props,
                  uid: this.uid,
                });
                if (Array.isArray(this.props.children)) {
                  return (this.props.props.children as JSX.Element[]).map(
                    (child, index) => (
                      <ViewParentContext.Provider
                        key={index}
                        value={{ uid: this.uid, childIndex: index }}
                      >
                        {child}
                      </ViewParentContext.Provider>
                    )
                  );
                } else {
                  return (
                    <ViewParentContext.Provider
                      value={{ uid: this.uid, childIndex: 0 }}
                    >
                      {this.props.props.children}
                    </ViewParentContext.Provider>
                  );
                }
              }}
            </ViewParentContext.Consumer>
          );
        }}
      </AppContext.Consumer>
    );
  }
}
export default ViewComponent;
