import { CompiledAppTransport, CompiledAppEvents } from "./compiledTypes";
import { EventContent, Events } from "./enum";
import { AppEvents, Prop, Transport } from "./types";

const emitHandlerMap: {
    [Key in keyof typeof map]: (data: AppEvents[Key]) => CompiledAppEvents[(typeof map)[Key]];
} = {
    delete_view: (data) => {
        return data.viewUid;
    },
    request_event: (data) => {
        return {
            [EventContent.EventUid]: data.eventUid,
            [EventContent.EventArgs]: data.eventArguments,
            [EventContent.Uid]: data.uid,
        };
    },
    request_views_tree: () => {
        return undefined;
    },
    respond_to_event: (data) => {
        return {
            [EventContent.Data]: data.data,
            [EventContent.EventUid]: data.eventUid,
            [EventContent.Uid]: data.uid,
        };
    },
    update_view: (data) => {
        return {
            [EventContent.ChildIndex]: data.view.childIndex,
            [EventContent.Name]: data.view.name,
            [EventContent.ParentUid]: data.view.parentUid,
            [EventContent.Props]: {
                [EventContent.Create]: data.view.props.create.map((prop) => ({
                    [EventContent.Data]: prop.type === "data" ? prop.data : undefined,
                    [EventContent.Name]: prop.name,
                    [EventContent.Type]: prop.type === "data" ? EventContent.Data : EventContent.Event,
                    [EventContent.Uid]: prop.type === "event" ? prop.uid : undefined,
                })),
                [EventContent.Merge]: data.view.props.merge.map((prop) => ({
                    [EventContent.Data]: prop.type === "data" ? prop.data : undefined,
                    [EventContent.Name]: prop.name,
                    [EventContent.Type]: prop.type === "data" ? EventContent.Data : EventContent.Event,
                    [EventContent.Uid]: prop.type === "event" ? prop.uid : undefined,
                })),
                [EventContent.Delete]: data.view.props.delete,
            },
            [EventContent.Uid]: data.view.uid,
            [EventContent.isRoot]: data.view.isRoot,
        };
    },
    update_views_tree: (data) => {
        return {
            [EventContent.Views]: data.views.map((view) => ({
                [EventContent.ChildIndex]: view.childIndex,
                [EventContent.Name]: view.name,
                [EventContent.ParentUid]: view.parentUid,
                [EventContent.Props]: view.props.map((prop) => ({
                    [EventContent.Data]: prop.type === "data" ? prop.data : undefined,
                    [EventContent.Name]: prop.name,
                    [EventContent.Type]: prop.type === "data" ? EventContent.Data : EventContent.Event,
                    [EventContent.Uid]: prop.type === "event" ? prop.uid : undefined,
                })),
                [EventContent.Uid]: view.uid,
                [EventContent.isRoot]: view.isRoot,
            })),
        };
    },
};


const map = {
    delete_view: Events.DeleteView,
    request_event: Events.RequestEvent,
    request_views_tree: Events.RequestViewsTree,
    respond_to_event: Events.RespondToEvent,
    update_view: Events.UpdateView,
    update_views_tree: Events.UpdateViewsTree,
} as const;

type ReverseMap<T extends Record<keyof T, keyof any>> = {
    [P in T[keyof T]]: {
        [K in keyof T]: T[K] extends P ? K : never
    }[keyof T]
}




const onHandlerMap: {
    [Key in keyof ReverseMap<typeof map>]: (data: CompiledAppEvents[Key]) => AppEvents[ReverseMap<typeof map>[Key]];
} = {
    [Events.DeleteView]: (data) => {
        return { viewUid: data }
    },
    [Events.RequestEvent]: (data) => {
        return {
            eventArguments: data[EventContent.EventArgs],
            eventUid: data[EventContent.EventUid],
            uid: data[EventContent.Uid],
        }
    },
    [Events.RequestViewsTree]: () => {
        return
    },
    [Events.RespondToEvent]: (data) => {
        return {
            data: data[EventContent.Data],
            eventUid: data[EventContent.EventUid],
            uid: data[EventContent.Uid],
        }
    },
    [Events.UpdateView]: (data) => {
        return {
            view: {
                childIndex: data[EventContent.ChildIndex],
                name: data[EventContent.Name],
                parentUid: data[EventContent.ParentUid],
                props: {
                    create: (data[EventContent.Props][EventContent.Create] || []).map((prop) => ({
                        name: prop[EventContent.Name],
                        data: prop[EventContent.Data],
                        type: prop[EventContent.Type] === EventContent.Data ? "data" : "event",
                        uid: prop[EventContent.Uid],
                    })) as unknown as Prop[],
                    merge: (data[EventContent.Props][EventContent.Merge] || []).map((prop) => ({
                        name: prop[EventContent.Name],
                        data: prop[EventContent.Data],
                        type: prop[EventContent.Type] === EventContent.Data ? "data" : "event",
                        uid: prop[EventContent.Uid],
                    })) as unknown as Prop[],
                    delete: data[EventContent.Props][EventContent.Delete] || [],
                },
                uid: data[EventContent.Uid],
                isRoot: data[EventContent.isRoot],
            },
        }
    },
    [Events.UpdateViewsTree]: (data) => {
        return {
            views: (data[EventContent.Views] || []).map((view) => ({
                childIndex: view[EventContent.ChildIndex],
                name: view[EventContent.Name],
                parentUid: view[EventContent.ParentUid],
                props: (view[EventContent.Props] || []).map((prop) => ({
                    name: prop[EventContent.Name],
                    data: prop[EventContent.Data],
                    type: prop[EventContent.Type] === EventContent.Data ? "data" : "event",
                    uid: prop[EventContent.Uid],
                }) as unknown as Prop),
                uid: view[EventContent.Uid],
                isRoot: view[EventContent.isRoot],
            })),
        }
    },
};

export const decompileTransport = (transport: Transport<Record<string, any>>) => {
    const on = <Key extends keyof AppEvents>(event: Key, handler: (data: AppEvents[Key]) => void) => {
        const handlerExtended = (data: any) => {
            handler((onHandlerMap[map[event]] as any)(data));
        };
        transport.on(String(map[event]), handlerExtended);
        return () => transport.off?.(String(map[event]), handlerExtended);
    }
    const emit = <Key extends keyof AppEvents>(event: Key, data?: AppEvents[Key]) => {
        transport.emit(String(map[event]), (emitHandlerMap[event] as any)(data!) as any);
    }
    return { on, emit };
}

const emitFactory = () => {
    const events = map;
    return new Proxy(events, {
        get: (target, prop) => {
            if (prop in target) {
                return (transport: Transport<Record<string, any>>, data?: AppEvents[keyof AppEvents]) => {
                    transport.emit(String(map[prop as keyof AppEvents]), (emitHandlerMap[prop as keyof AppEvents] as any)(data!) as any);
                }
            }
            return undefined;
        }
    }) as unknown as {
        /**
         * @param transport
         * @param data
         * @description emit event to transport
         */
        [Key in keyof AppEvents]: (transport: Transport<Record<string, any>>, data?: AppEvents[Key]) => void;
    }
}

/**
 * for usage in custom clients
 */
export const emit = emitFactory();

export type DecompileTransport = ReturnType<typeof decompileTransport>;