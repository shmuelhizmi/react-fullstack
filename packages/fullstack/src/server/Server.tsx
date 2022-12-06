import React, { useState } from "react";
import { useEffect, useRef } from "react";
import {
  Transport,
  ViewsRenderer,
} from "../shared";
import App from "./App";

export interface ServerProps<
  TransportClientEvents extends { disconnect: any },
  TransportServerEvents extends {
    connection: Transport<TransportClientEvents> & { id: string };
  }
> {
  /**
   * The server react app
   */
  children: () => JSX.Element;
  /**
   * share one app across all clients.
   */
  singleInstance?: boolean;
  /**
   * main server commination transport
   */
  transport: Transport<TransportServerEvents>;
  /**
   * instance render handler
   * could be used to render the app into a components tree (for ssr)
   */
  instanceRenderHandler?: ServerInstanceRenderHandler;
}

const setApp = Symbol("setApp");

export function createInstanceRenderHandler() {
  let app: App;
  return {
    [setApp]: (newApp: App) => {
      app = newApp;
    },
    render(views: Record<string, React.ComponentType<any>>) {
      return <ViewsRenderer viewsData={app?.views || []} views={views} />;
    },
  };
}

export type ServerInstanceRenderHandler = ReturnType<
  typeof createInstanceRenderHandler
>;

export function Server<
  TransportClientEvents extends { disconnect: any },
  TransportServerEvents extends {
    connection: Transport<TransportClientEvents> & { id: string };
  }
>(props: ServerProps<TransportClientEvents, TransportServerEvents>) {
  const { children, singleInstance, transport } = props;
  const app = useRef<App>();
  const [clients, setClients] = useState<Record<string, Transport<any>>>({});

  useEffect(() => {
    transport.on("connection", (clientTransport) => {
      if (app.current) {
        if (singleInstance) {
          app.current.addClient(clientTransport);
        } else {
          setClients((clients) => {
            const newClients = { ...clients };
            newClients[clientTransport.id] = clientTransport;
            return newClients;
          });
        }
      }
      clientTransport.on("disconnect", () => {
        if (app.current) {
          if (singleInstance) {
            app.current.removeClient(clientTransport);
          } else {
            setClients((clients) => {
              const newClients = { ...clients };
              delete newClients[clientTransport.id];
              return newClients;
            });
          }
        }
      });
    });
  }, [singleInstance, transport]);


  return (
    <>
      <App
        paused={!singleInstance}
        transport={transport}
        transportIsClient={false}
        children={children}
        ref={(ref) => {
          app.current = ref || undefined;
          if (props.instanceRenderHandler) props.instanceRenderHandler[setApp](ref!);
        }}
      />
      {!singleInstance &&
        Object.keys(clients).map((id) => (
          <App
            transport={clients[id]}
            transportIsClient
            children={children}
            key={id}
            paused={false}
          />
        ))}
    </>
  );
}
