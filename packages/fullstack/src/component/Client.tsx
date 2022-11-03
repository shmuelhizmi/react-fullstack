import React from "react";
import { v4 } from "uuid";
import { Views, ViewsToComponents } from "../Views";
import { ExistingSharedViewData, ShareableViewData, Transport } from "../types";
import { decompileTransport } from "../decompiled-transport";

interface ClientState {
  runningViews: ExistingSharedViewData[];
}

const stringifyWithoutCircular = (json: any) => {
  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (_key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };
  
  return JSON.stringify(json, getCircularReplacer());
}
class Client<ViewsInterface extends Views> extends React.Component<
  {
    transport: Transport<Record<string, any>>;
    views: ViewsToComponents<ViewsInterface>;
    requestViewTreeOnMount?: boolean;
  },
  ClientState
> {
  state: ClientState = {
    runningViews: [],
  };
  transport = decompileTransport(this.props.transport);
  componentDidMount = () => {
    this.transport.on(
      "update_views_tree",
      ({ views }) => {
        this.setState({ runningViews: views });
      }
    );
    this.transport.on(
      "update_view",
      ({ view }: { view: ShareableViewData }) => {
        this.setState((state) => {
          const runningView = state.runningViews.find(
            (currentView) => currentView.uid === view.uid
          );
          if (runningView) {
            runningView.props = runningView.props.filter((prop) => !view.props.delete.includes(prop.name));
            view.props.create.forEach((newProp) => {
              runningView.props.push(newProp);
            })
          } else {
            state.runningViews.push({...view, props: view.props.create });
          }
          return { runningViews: [...state.runningViews] };
        });
      }
    );
    this.transport.on(
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
    if (this.props.requestViewTreeOnMount) {
      this.transport.emit("request_views_tree");
    }
  }
  renderView = (view: ExistingSharedViewData): JSX.Element => {
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
              this.transport.on(
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
              this.transport.emit("request_event", {
                eventArguments: JSON.parse(stringifyWithoutCircular(args)),
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
  render = () => {
    const roots = this.state.runningViews.filter((view) => view.isRoot);
    if (roots.length === 0) {
      return <></>;
    }
    return roots.map(this.renderView);
  }
}

export default Client;
