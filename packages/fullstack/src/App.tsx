import React from "react";
import { v4 } from "uuid";
import { Render } from "@react-fullstack/render";
import { Views, ViewsToServerComponents } from "./Views";
import ViewComponent from "./component/ViewComponent";
import { AppContext } from "./Contexts";
import { AppTransport } from "./types";

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

type ViewDataBase = {
  uid: string;
  name: string;
  parentUid: string;
  childIndex: number;
  isRoot: boolean;
};
type ViewData = ViewDataBase & {
  props: Record<string, any>;
};

export type ShareableViewData = ViewDataBase & {
  props: Array<
    {
      name: string;
    } & (
      | {
          type: "data";
          data: any;
        }
      | {
          type: "event";
          uid: string;
        }
    )
  >;
};

class App<ViewsInterface extends Views> {
  private reactTree: () => JSX.Element;
  private server?: AppTransport;
  private clients: AppTransport[] = [];
  private viewsObject: ViewsInterface;
  private runningViews: ViewData[] = [];
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
    this.views = this.genarateViews();
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
      throw TypeError("connot pause app before app is started");
    }
  };
  public resumeApp = () => {
    if (this.reactTreeController) {
      this.reactTreeController.continue();
      this._isAppStopped = false;
    } else {
      throw TypeError("connot resume app before app is started");
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
        views: this.runningViews.map((runningView) =>
          this.parseViewData(runningView)
        ),
      });
    };
    client.on("request_views_tree", requestViewsTreeHandler);
    this.cleanUpFunctions.push(() => {
      if (client.off) {
        client.off("request_views_tree", requestViewsTreeHandler);
      }
    });
  }
  private genarateViews() {
    const views = this.viewsObject;
    const viewsNames = Object.keys(views) as (keyof typeof views)[];
    const genaratedViews: ViewsToServerComponents<ViewsInterface> = {} as ViewsToServerComponents<
      ViewsInterface
    >;
    viewsNames.forEach((viewName) => {
      genaratedViews[viewName] = (((props: any) => (
        <ViewComponent name={viewName as string} props={props} />
      )) as unknown) as typeof genaratedViews[typeof viewName];
    });
    return genaratedViews;
  }
  public updateRunningView(viewData: ViewData) {
    const runningViewIndex = this.runningViews.findIndex(
      (view) => view.uid === viewData.uid
    );
    if (runningViewIndex !== -1) {
      this.runningViews[runningViewIndex] = viewData;
    } else {
      this.runningViews.push(viewData);
    }
    if (!this.server) {
      return;
    }
    this.server.emit("update_view", { view: this.parseViewData(viewData) });
  }
  public deleteRunningView = (uid: string) => {
    const runningViewIndex = this.runningViews.findIndex(
      (view) => view.uid === uid
    );
    if (runningViewIndex !== -1) {
      this.runningViews.splice(runningViewIndex, 1);
      if (!this.server) {
        return;
      }
      this.server.emit("delete_view", { viewUid: uid });
    }
  };
  private registerViewEvent(
    event: (...args: any) => any | Promise<any>,
    viewUid: string
  ): string {
    const eventUid = v4();
    this.clients.forEach((client) => {
      const requestEventHandler = ({
        eventArguments,
        eventUid: requestedEventUid,
        uid: currentEventUid,
      }: {
        eventArguments: any[];
        uid: string;
        eventUid: string;
      }) => {
        if (requestedEventUid !== eventUid) {
          return;
        }
        const stillExist = !!this.runningViews.find(
          (view) => view.uid === viewUid
        );
        if (stillExist) {
          const eventResult = event(...eventArguments);
          if (eventResult instanceof Promise) {
            eventResult.then((result) => {
              client.emit("respond_to_event", {
                data: result && JSON.parse(JSON.stringify(result)),
                uid: currentEventUid,
                eventUid,
              });
            });
          } else {
            client.emit("respond_to_event", {
              data: eventResult && JSON.parse(JSON.stringify(eventResult)),
              uid: currentEventUid,
              eventUid,
            });
          }
        }
      };
      client.on("request_event", requestEventHandler);
      this.cleanUpFunctions.push(() => {
        if (client.off) {
          client.off("request_event", requestEventHandler);
        }
      });
    });
    return eventUid;
  }
  private parseViewData(viewData: ViewData): ShareableViewData {
    const { childIndex, isRoot, name, parentUid, uid } = viewData;
    const props = Object.keys(viewData.props)
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
            uid: this.registerViewEvent(prop, uid),
          };
        } else {
          return {
            name,
            type: "data" as const,
            data: JSON.parse(JSON.stringify(prop)),
          };
        }
      });
    return {
      childIndex,
      isRoot,
      name,
      parentUid,
      uid,
      props,
    };
  }
}

export default App;
