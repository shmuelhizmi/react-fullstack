export enum Events {
    UpdateView = 0,
    DeleteView,
    UpdateViewsTree,
    RequestViewsTree,
    RespondToEvent,
    RequestEvent,
}

export enum EventContent {
    Data = 0,
    Uid,
    EventUid,
    ParentUid,
    ChildIndex,
    isRoot,
    EventArgs,
    View,
    Views,
    Props,
    Create,
    Merge,
    Delete,
    Name,
    Type,
    Event,
}