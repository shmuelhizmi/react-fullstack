import React from "react";

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

export interface AppEvents {
  update_views_tree: {
    views: ExistingSharedViewData[];
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

export type ViewDataBase = {
  uid: string;
  name: string;
  parentUid: string;
  childIndex: number;
  isRoot: boolean;
};

export type ViewData = ViewDataBase & {
  props: Record<string, any>;
};

export type Prop = {
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
);

export type ShareableViewData = ViewDataBase & {
  props: {
    create: Array<Prop>;
    merge: Array<Prop>; // TO DO - support view merging
    delete: string[];
  }
};

export type ExistingSharedViewData = ViewDataBase & {
  props: Array<Prop>;
  
};

export type AppTransport = Transport<AppEvents>;

export type Views = Record<string, View<any>>;

export type View<Props extends Record<string, any>> = {
  props: React.PropsWithChildren<Props>;
};