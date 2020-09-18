import React from "react";
import { v4 } from "uuid";
import { Views, ViewsToComponents } from "../Views";
import { ShareableViewData } from "../App";
import { Transport } from "../types";

interface ClientState {
  runningViews: ShareableViewData[];
}
class Client<ViewsInterface extends Views> extends React.Component<
  {
    transport: Transport;
    views: ViewsToComponents<ViewsInterface>;
  },
  ClientState
> {
  state: ClientState = {
    runningViews: [],
  };
  componentDidMount() {
    this.props.transport.on(
      "update_views_tree",
      ({ views }: { views: ShareableViewData[] }) => {
        this.setState({ runningViews: views });
      }
    );
    this.props.transport.on(
      "update_view",
      ({ view }: { view: ShareableViewData }) => {
        this.setState((state) => {
          const runningViewIndex = state.runningViews.findIndex(
            (currentView) => currentView.uid === view.uid
          );
          if (runningViewIndex !== -1) {
            state.runningViews[runningViewIndex] = view;
          } else {
            state.runningViews.push(view);
          }
          return { runningViews: [...state.runningViews] };
        });
      }
    );
    this.props.transport.on(
      "delete_view",
      ({ viewUid }: { viewUid: string }) => {
        this.setState((state) => {
          const runningViewIndex = state.runningViews.findIndex(
            (view) => view.uid === viewUid
          );
          if (runningViewIndex !== -1) {
            state.runningViews.splice(runningViewIndex, 1);
            return { runningViews: [...state.runningViews] };
          }
        });
      }
    );
    this.props.transport.emit("request_views_tree");
  }
  renderView(view: ShareableViewData): JSX.Element {
    const componentToRender = this.props.views[view.name];
    const props: any = { key: view.uid };
    view.props.forEach((prop) => {
      if (prop.type === "data") {
        props[prop.name] = prop.data;
      } else if (prop.type === "event")
        [
          (props[prop.name] = (...args: any) => {
            return new Promise((resolve) => {
              const requestUid = v4();
              this.props.transport.on(
                "respond_to_event",
                ({
                  data,
                  uid,
                  eventUid,
                }: {
                  data: any;
                  uid: string;
                  eventUid: string;
                }) => {
                  if (uid === requestUid && eventUid === prop.uid) {
                    resolve(data);
                  }
                }
              );
              this.props.transport.emit("request_event", {
                eventArguments: JSON.parse(JSON.stringify(args)),
                eventUid: prop.uid,
                uid: requestUid,
              });
            });
          }),
        ];
    });
    const children = this.state.runningViews
      .filter((runningView) => runningView.parentUid === view.uid)
      .sort((a, b) => a.childIndex - b.childIndex)
      .map((runningView) => this.renderView(runningView));
    return React.createElement(componentToRender, {
      ...props,
      children: children.length > 0 ? children : undefined,
    });
  }
  render() {
    const root = this.state.runningViews.find((view) => view.isRoot);
    if (!root) {
      return <></>;
    }
    return this.renderView(root);
  }
}

export default Client;
