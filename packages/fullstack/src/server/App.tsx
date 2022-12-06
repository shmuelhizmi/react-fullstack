import React from "react";
import { AppContext } from "./contexts";
import { ViewData, ExistingSharedViewData, Prop, Transport, DecompileTransport, decompileTransport, randomId } from "../shared";
import { deeplyEqual } from "./utils";

interface AppProps {
  children: () => JSX.Element;
  transport: Transport<any>;
  paused: boolean;
  transportIsClient: boolean;
}



class App extends React.Component<
  AppProps
> {
  private server: DecompileTransport;
  private clients: Transport<any>[] = [];
  private existingSharedViews: ExistingSharedViewData[] = [];
  private viewEvents = new Map<string, (...args: any) => any | Promise<any>>();
  private cleanUpFunctions: Function[] = [];
  constructor(props: AppProps) {
    super(props);
    this.server = decompileTransport(props.transport);
  }

  get views() {
    return this.existingSharedViews;
  }
  render = () =>
    !this.props.paused && (
      <AppContext.Provider value={this}>
        {this.props.children()}
      </AppContext.Provider>
    );

  componentDidMount = () => {
    if (this.props.transportIsClient) {
      this.addClient(this.props.transport);
    }
  };
  componentWillUnmount = () => {
    this.cleanUpFunctions.forEach((f) => f());
  };
  public addClient = (client: Transport<any>) => {
    const clientTransport = decompileTransport(client);
    this.clients.push(client);
    this.registerSocketListener(clientTransport);
  };
  public removeClient = (client: Transport<any>) => {
    this.clients = this.clients.filter(
      (currentClient) => currentClient !== client
    );
  };
  private registerSocketListener = (client: DecompileTransport) => {
    const requestViewsTreeHandler = () => {
      client.emit("update_views_tree", {
        views: this.existingSharedViews,
      });
    };
    const cleanReqTree = client.on("request_views_tree", requestViewsTreeHandler);
    const requestEventHandler = ({
      eventArguments,
      eventUid: requestedEventUid,
      uid: currentEventUid,
    }: {
      eventArguments: any[];
      uid: string;
      eventUid: string;
    }) => {
      const handler = this.viewEvents.get(requestedEventUid);
      if (!handler) {
        throw new Error(
          "the client is trying to access an event that does not exist"
        );
      }
      const eventResult = handler(...eventArguments);
      if (eventResult instanceof Promise) {
        eventResult.then((result) => {
          client.emit("respond_to_event", {
            data: result && result,
            uid: currentEventUid,
            eventUid: requestedEventUid,
          });
        });
      } else {
        client.emit("respond_to_event", {
          data: eventResult && eventResult,
          uid: currentEventUid,
          eventUid: requestedEventUid,
        });
      }
    };
    const cleanReqEvent = client.on("request_event", requestEventHandler);
    this.cleanUpFunctions.push(() => {
      cleanReqTree();
      cleanReqEvent();
    });
  };
  public updateRunningView = (viewData: ViewData) => {
    if (!this.server) {
      return;
    }
    const existingView = this.existingSharedViews.find(
      (view) => view.uid === viewData.uid
    );
    const mapProps = (name: string) => {
      const prop = viewData.props[name];
      if (typeof prop === "function") {
        return {
          name,
          type: "event" as const,
          uid: this.registerViewEvent(prop),
        };
      } else {
        return {
          name,
          type: "data" as const,
          data: prop,
        };
      }
    };
    const isValidProps = (name: string) => {
      return !["children", "key"].includes(name) && viewData.props[name] !== undefined;
    }
    const newPropsNames = Object.keys(viewData.props);
    if (!existingView) {
      const newView: ExistingSharedViewData = {
        ...viewData,
        props: newPropsNames.filter(isValidProps).map(mapProps),
      };
      this.existingSharedViews.push(newView);
      this.server.emit("update_view", {
        view: {
          ...newView,
          props: {
            delete: [],
            merge: [],
            create: newView.props,
          },
        },
      });
      return;
    }
    const propsToDelete = (existingView?.props || []).filter(
      (propName) => viewData.props[propName.name] === undefined
    );
    propsToDelete.forEach((prop) => {
      Reflect.deleteProperty(existingView.props, prop.name);
    });
    const boundExistingProps = (name: string) => {
      const existing = existingView && existingView.props.find((prop) => prop.name === name);
      if (!existing) {
        existingView.props.push(mapProps(name));
        return true;
      }
      if (existing.type === "data") {
        if (!deeplyEqual(existing.data, viewData.props[name])) {
          existing.data = viewData.props[name];
          return true;
        }
        return false;
      }
      if (existing.type === "event") {
        if (typeof viewData.props[name] === "function") {
          this.viewEvents.set(existing.uid, viewData.props[name]);
          return false;
        }
        existingView.props = existingView.props.filter((prop) => prop.name !== name);
        existingView.props.push(mapProps(name));
        return true;
      }
    }
    const propsToAdd = newPropsNames.filter(
      (name) => {
        if (!isValidProps(name)) {
          return false;
        }
        return boundExistingProps(name);
      }
    ).map((name) => {
      return existingView.props.find((prop) => prop.name === name);
    }).filter(Boolean) as Prop[];
    if (propsToAdd.length === 0 && propsToDelete.length === 0) {
      return;
    }
    if (propsToAdd.length > 0 || propsToDelete.length > 0) {
      this.server.emit("update_view", {
        view: {
          ...existingView,
          props: {
            create: propsToAdd,
            delete: propsToDelete.map((prop) => prop.name),
            merge: [],
          },
        },
      });
    }
  };
  public deleteRunningView = (uid: string) => {
    const runningViewIndex = this.existingSharedViews.findIndex(
      (view) => view.uid === uid
    );
    if (runningViewIndex !== -1) {
      const deletedView = this.existingSharedViews.splice(
        runningViewIndex,
        1
      )[0];
      deletedView.props.forEach(
        (prop) => prop.type === "event" && this.viewEvents.delete(prop.uid)
      );
      if (!this.server) {
        return;
      }
      this.server.emit("delete_view", { viewUid: uid });
    }
  };

  private registerViewEvent = (
    event: (...args: any) => any | Promise<any>
  ): string => {
    const eventUid = randomId();
    this.viewEvents.set(eventUid, event);
    return eventUid;
  };
}

export default App;
