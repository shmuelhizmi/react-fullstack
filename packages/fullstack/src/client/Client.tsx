import React from "react";
import { ViewsToComponents } from "./types";
import {
  ExistingSharedViewData,
  ShareableViewData,
  Transport,
  Views,
  decompileTransport,
  randomId,
  ViewsRenderer,
} from "../shared";

interface ClientState {
  runningViews: ExistingSharedViewData[];
}

const stringifyWithoutCircular = (json: any[]) => {
  if (
    json.some(
      (child) =>
        child instanceof Event ||
        (typeof child === "object" && "_reactName" in child)
    )
  ) {
    throw new Error(
      "passing js events to the server is prohibited, make sure you are not passing a callback's directly to a dom element"
    );
  }
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
};
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
    this.transport.on("update_views_tree", ({ views }) => {
      this.setState({ runningViews: views });
    });
    this.transport.on(
      "update_view",
      ({ view }: { view: ShareableViewData }) => {
        this.setState((state) => {
          const runningView = state.runningViews.find(
            (currentView) => currentView.uid === view.uid
          );
          if (runningView) {
            runningView.props = runningView.props.filter(
              (prop) => !view.props.delete.includes(prop.name)
            );
            view.props.create.forEach((newProp) => {
              runningView.props.push(newProp);
            });
          } else {
            state.runningViews.push({ ...view, props: view.props.create });
          }
          return { runningViews: [...state.runningViews] };
        });
      }
    );
    this.transport.on("delete_view", ({ viewUid }: { viewUid: string }) => {
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
    if (this.props.requestViewTreeOnMount) {
      this.transport.emit("request_views_tree");
    }
  };

  createEvent = (eventUid: string, ...args: any) => {
    return new Promise((resolve) => {
      const requestUid = randomId();
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
          if (uid === requestUid && eventUid === eventUid) {
            resolve(data);
          }
        }
      );
      this.transport.emit("request_event", {
        eventArguments: JSON.parse(stringifyWithoutCircular(args)),
        eventUid: eventUid,
        uid: requestUid,
      });
    });
  };
  render = () => {
    return (
      <ViewsRenderer
        views={this.props.views}
        viewsData={this.state.runningViews}
        createEvent={this.createEvent}
      />
    );
  };
}

export default Client;
