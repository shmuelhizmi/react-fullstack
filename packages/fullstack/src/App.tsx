import React from "react";
import { v4 } from "uuid";
import { Render } from "@react-fullstack/render";
import { Views, ViewsToServerComponents } from "./Views";
import ViewComponent from "./component/ViewComponent";
import { AppContext } from "./Contexts";
import {
  AppTransport,
  ViewData,
  ExistingSharedViewData,
  Prop,
} from "./types";

interface AppParameters<ViewsInterface extends Views> {
  reactTree: () => JSX.Element;
  views: ViewsInterface;
}

const getAppContext = <ViewsInterface extends Views>() => {
  const Type = React.createContext<App<ViewsInterface> | undefined>(undefined);
  return AppContext as typeof Type;
};

export const ViewsProvider = <ViewsInterface extends Views>(props: {
  children: (views: ViewsToServerComponents<ViewsInterface>) => JSX.Element;
}) => {
  const Context = getAppContext<ViewsInterface>();
  return (
    <Context.Consumer>
      {(app) => {
        if (!app) {
          return;
        }
        return props.children(app.views);
      }}
    </Context.Consumer>
  );
};

class App<ViewsInterface extends Views> {
  private reactTree: () => JSX.Element;
  private server?: AppTransport;
  private clients: AppTransport[] = [];
  private viewsObject: ViewsInterface;
  private existingSharedViews: ExistingSharedViewData[] = [];
  private viewEvents = new Map<string, (...args: any) => any | Promise<any>>();
  public readonly views: ViewsToServerComponents<ViewsInterface>;
  private _isAppRunning = false;
  private _isAppStopped = false;
  private reactTreeController?: ReturnType<typeof Render>;
  private cleanUpFunctions: Function[] = [];
  public get isAppRunning() {
    return this._isAppRunning;
  }
  public get isAppStopped() {
    return this._isAppStopped;
  }
  constructor(params: AppParameters<ViewsInterface>) {
    this.reactTree = params.reactTree;
    this.viewsObject = params.views;
    this.views = this.generateViews();
  }
  public Context = getAppContext<ViewsInterface>();
  public startServer(server: AppTransport) {
    this.server = server;
    this.reactTreeController = Render(
      <this.Context.Provider value={this}>
        {this.reactTree()}
      </this.Context.Provider>
    );
  }
  public pauseApp = () => {
    if (this.reactTreeController) {
      this.reactTreeController.stop();
      this._isAppStopped = true;
    } else {
      throw TypeError("cannot pause app before app is started");
    }
  };
  public resumeApp = () => {
    if (this.reactTreeController) {
      this.reactTreeController.continue();
      this._isAppStopped = false;
    } else {
      throw TypeError("cannot resume app before app is started");
    }
  };
  public close = () => {
    this.pauseApp();
    this._isAppStopped = true;
    this.cleanUpFunctions.forEach((cleanUp) => cleanUp());
  };
  public addClient(client: AppTransport) {
    this.clients.push(client);
    this.registerSocketListener(client);
  }
  public removeClient = (client: AppTransport) => {
    this.clients = this.clients.filter(
      (currentClient) => currentClient !== client
    );
  };
  private registerSocketListener(client: AppTransport) {
    const requestViewsTreeHandler = () => {
      client.emit("update_views_tree", {
        views: this.existingSharedViews,
      });
    };
    client.on("request_views_tree", requestViewsTreeHandler);
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
            data: result && JSON.parse(JSON.stringify(result)),
            uid: currentEventUid,
            eventUid: requestedEventUid,
          });
        });
      } else {
        client.emit("respond_to_event", {
          data: eventResult && JSON.parse(JSON.stringify(eventResult)),
          uid: currentEventUid,
          eventUid: requestedEventUid,
        });
      }
    };
    client.on("request_event", requestEventHandler);
    this.cleanUpFunctions.push(() => {
      if (client.off) {
        client.off("request_views_tree", requestViewsTreeHandler);
        client.off("request_event", requestEventHandler);
      }
    });
  }
  private generateViews() {
    const views = this.viewsObject;
    const viewsNames = Object.keys(views) as (keyof typeof views)[];
    const generatedViews: ViewsToServerComponents<ViewsInterface> = {} as ViewsToServerComponents<ViewsInterface>;
    viewsNames.forEach((viewName) => {
      generatedViews[viewName] = (((props: any) => (
        <ViewComponent name={viewName as string} props={props} />
      )) as unknown) as typeof generatedViews[typeof viewName];
    });
    return generatedViews;
  }
  public updateRunningView(viewData: ViewData) {
    if (!this.server) {
      return;
    }
    const { childIndex, isRoot, name, parentUid, uid } = viewData;
    const newProps = Object.keys(viewData.props)
      .filter(
        (name) =>
          !["children", "key"].includes(name) &&
          viewData.props[name] !== undefined
      )
      .map((name) => {
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
            data: JSON.parse(JSON.stringify(prop)),
          };
        }
      });
    const existingView = this.existingSharedViews.find(
      (view) => view.uid === uid
    );
    const result: ExistingSharedViewData = {
      childIndex,
      isRoot,
      name,
      parentUid,
      uid,
      props: newProps,
    };
    if (!existingView) {
      this.existingSharedViews.push(result);
      this.server.emit("update_view", {
        view: {
          ...result,
          props: {
            delete: [],
            merge: [],
            create: result.props,
          },
        },
      });
    } else {
      const createProps: Prop[] = [];
      const deleteProps: string[] = [];
      const newPropsNames = newProps.map((newProp) => newProp.name);
      existingView.props = existingView.props.filter((existingProp) => {
        if (newPropsNames.includes(existingProp.name)) {
          return true;
        }
        deleteProps.push(existingProp.name);
        if (existingProp.type === "event") {
          this.viewEvents.delete(existingProp.uid);
        }
      });
      newProps.forEach((newProp) => {
        const existingProp = existingView.props.find(
          (prop) => prop.name === newProp.name
        ) as Prop;
        if (newProp.type === "event" && existingProp.type === "event") {
          if (
            this.viewEvents.get(newProp.uid) ===
            this.viewEvents.get(existingProp.uid)
          ) {
            this.viewEvents.delete(newProp.uid);
          } else {
            createProps.push(newProp);
          }
        } else if (newProp.type === "data" && existingProp.type === "data") {
          if (
            JSON.stringify(newProp.data) !== JSON.stringify(existingProp.data)
          ) {
            createProps.push(newProp);
          }
        }
      });
      if (deleteProps.length > 0 || createProps.length > 0) {
        this.server.emit("update_view", {
          view: {
            ...result,
            props: {
              create: createProps,
              delete: deleteProps,
              merge: [],
            },
          },
        });
      }
    }
  }
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

  private registerViewEvent(
    event: (...args: any) => any | Promise<any>
  ): string {
    const eventUid = v4();
    this.viewEvents.set(eventUid, event);
    return eventUid;
  }
}

export default App;
