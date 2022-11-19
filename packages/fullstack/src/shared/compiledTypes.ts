import { EventContent, Events } from "./enum";

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

export interface CompiledAppEvents {
  [Events.UpdateViewsTree]: {
    [EventContent.Views]: ExistingSharedViewData[];
  };
  [Events.UpdateView]: ShareableViewData;
  [Events.DeleteView]: string;
  [Events.RequestViewsTree]: void;
  [Events.RespondToEvent]: {
    [EventContent.Data]: any;
    [EventContent.Uid]: string;
    [EventContent.EventUid]: string;
  };
  [Events.RequestEvent]: {
    [EventContent.EventArgs]?: any[];
    [EventContent.Uid]: string;
    [EventContent.EventUid]: string;
  };
}

export type ViewDataBase = {
  [EventContent.Uid]: string;
  [EventContent.Name]: string;
  [EventContent.ParentUid]: string;
  [EventContent.ChildIndex]: number;
  [EventContent.isRoot]: boolean;
};

export type ViewData = ViewDataBase & {
  [EventContent.Props]: Record<string, any>;
};

export type Prop = {
  [EventContent.Name]: string;
  [EventContent.Type]: EventContent.Data | EventContent.Event;
  [EventContent.Data]?: any;
  [EventContent.Uid]?: string;
};

export type ShareableViewData = ViewDataBase & {
  [EventContent.Props]: {
    [EventContent.Create]?: Array<Prop>;
    [EventContent.Merge]?: Array<Prop>; // TO DO - support view merging
    [EventContent.Delete]?: string[];
  }
};

export type ExistingSharedViewData = ViewDataBase & {
  [EventContent.Props]: Array<Prop>;

};


export type CompiledAppTransport = Transport<CompiledAppEvents>;
