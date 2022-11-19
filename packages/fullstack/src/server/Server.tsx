import React, { useState } from "react";
import { useEffect, useRef } from "react";
import { AppTransport, Transport } from "../shared";
import App from "./App";

interface Props<
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
}

export function Server<
  TransportClientEvents extends { disconnect: any },
  TransportServerEvents extends {
    connection: Transport<TransportClientEvents> & { id: string };
  }
>(props: Props<TransportClientEvents, TransportServerEvents>) {
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
