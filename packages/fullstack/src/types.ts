import { ShareableViewData } from "./App";

export interface Transport<Events extends object> {
  emit: <T extends keyof Events>(event: T, message?: Events[T]) => void;
  on: <T extends keyof Events>(
    event: T,
    handler: (data: Events[T]) => void
  ) => void;
  off?: <T extends keyof Events>(
    event: T,
    handler: (data: Events[T]) => void
  ) => void;
}

interface AppEvents {
  update_views_tree: {
    views: ShareableViewData[];
  };
  update_view: {
    view: ShareableViewData;
  };
  delete_view: {
    viewUid: string;
  };
  request_views_tree: void;
  respond_to_event: {
    data: any;
    uid: string;
    eventUid: string;
  };
  request_event: {
    eventArguments: any[];
    uid: string;
    eventUid: string;
  };
}

export type AppTransport = Transport<AppEvents>;
