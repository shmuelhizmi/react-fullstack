import React from "react";
import { v4 } from "uuid";
import { Views, ViewsToComponents } from "../Views";
import { ShareableViewData } from "../App";
import type Socket from "socket.io-client";

interface ClientState {
  runningViews: ShareableViewData[];
}

class Client<ViewsInterface extends Views> extends React.Component<
  {
    host: string;
    port: number;
    views: ViewsToComponents<ViewsInterface>;
  },
  ClientState
> {
  state: ClientState = { runningViews: [] };
  socket = (require("socket.io-client") as typeof Socket)(`${this.props.host}:${this.props.port}`);
  componentDidMount() {
    this.socket.on(
      "update_views_tree",
      ({ views }: { views: ShareableViewData[] }) => {
        this.setState({ runningViews: views });
      }
    );
    this.socket.on("update_view", ({ view }: { view: ShareableViewData }) => {
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
    });
    this.socket.on("delete_view", ({ viewUid }: { viewUid: string }) => {
      this.setState((state) => {
        const runningViewIndex = state.runningViews.findIndex(
          (view) => view.uid === viewUid
        );
        if (runningViewIndex !== -1) {
          state.runningViews.splice(runningViewIndex, 1);
          return { runningViews: [...state.runningViews] };
        }
      });
    });
    this.socket.emit("request_views_tree");
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
              this.socket.on(
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
              this.socket.emit("request_event", {
                eventArguments: JSON.parse(JSON.stringify(args)),
                eventUid: prop.uid,
                uid: requestUid,
              });
            });
          }),
        ];
    });
    return React.createElement(componentToRender, {
      ...props,
      children: this.state.runningViews
        .filter((runningView) => runningView.parentUid === view.uid)
        .sort((a, b) => a.childIndex - b.childIndex)
        .map((runningView) => this.renderView(runningView)),
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
