import React from "react";
import { v4 } from "uuid";
import { Render } from "@react-fullstack/render";
import { Views, ViewsToServerComponents } from "./Views";
import ViewComponent from "./component/ViewComponent";
import { AppContext } from "./Contexts";
import { Transport } from "./component/Client";

interface AppParameters<ViewsInterface extends Views> {
  reactTree: () => JSX.Element;
  transport: Transport;
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
        return props.children(app.createViews());
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
  private transport: Transport;
  private views: ViewsInterface;
  private runningViews: ViewData[] = [];
  constructor(params: AppParameters<ViewsInterface>) {
    this.reactTree = params.reactTree;
    this.transport = params.transport;
    this.views = params.views;
  }
  public Context = getAppContext<ViewsInterface>();
  public start() {
    this.registerSocketListener();
    Render(
      <this.Context.Provider value={this}>
        {this.reactTree()}
      </this.Context.Provider>
    );
  }
  private registerSocketListener() {
    this.transport.on("request_views_tree", () => {
      this.transport.emit("update_views_tree", {
        views: this.runningViews.map((runningView) =>
          this.parseViewData(runningView)
        ),
      });
    });
  }
  public createViews() {
    const views = this.views;
    const viewsNames = Object.keys(this.views) as (keyof typeof views)[];
    const genaratedViews: ViewsToServerComponents<ViewsInterface> = {} as ViewsToServerComponents<
      ViewsInterface
    >;
    viewsNames.forEach((viewName) => {
      genaratedViews[viewName] = (((props: any) => (
        <ViewComponent name={viewName} {...props} />
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
    this.transport.emit("update_view", { view: this.parseViewData(viewData) });
  }
  public deleteRunningView = (uid: string) => {
    const runningViewIndex = this.runningViews.findIndex(
      (view) => view.uid === uid
    );
    if (runningViewIndex !== -1) {
      this.runningViews.splice(runningViewIndex, 1);
      this.transport.emit("delete_view", { viewUid: uid });
    }
  };
  private registerViewEvent(
    event: (...args: any) => any | Promise<any>,
    viewUid: string
  ): string {
    const eventUid = v4();
    this.transport.on(
      `request_event`,
      ({
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
              this.transport.emit(`respond_to_event`, {
                data: result && JSON.parse(JSON.stringify(result)),
                uid: currentEventUid,
                eventUid,
              });
            });
          } else {
            this.transport.emit(`respond_to_event`, {
              data: eventResult && JSON.parse(JSON.stringify(eventResult)),
              uid: currentEventUid,
              eventUid,
            });
          }
        }
      }
    );
    return eventUid;
  }
  private parseViewData(viewData: ViewData): ShareableViewData {
    const { childIndex, isRoot, name, parentUid, uid } = viewData;
    const props = Object.keys(viewData.props).filter((name) => !["children", "key"].includes(name)).map((name) => {
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
