import React, { useCallback, useEffect, useRef } from "react";
import SocketIO from "socket.io";
import { Transport } from "@react-fullstack/fullstack/shared";
import type { Server as ServerBase } from "@react-fullstack/fullstack/server";
// @ts-ignore
import { Server as EiowsServer } from "eiows"

interface Props {
  /**
   * The port the socket will run on.
   */
  port: number;
  /**
   * The server react app
   */
  children: () => JSX.Element;
  /**
   * share one app across all clients.
   */
  singleInstance?: boolean;
  /**
   * socket.io server options, note: must be passed with the first component mount, updating this prop will have no effect.
   * Note: cors header does not default to "*"
   */
  socketOptions?: Partial<SocketIO.ServerOptions>;
}

function SocketServer (props: Props & { ServerBase: typeof ServerBase }) {
  const { ServerBase } = props;
  const serverRef = useRef<SocketIO.Server<any, any>>();
  if (!serverRef.current) {
    const server = new SocketIO.Server(props.socketOptions, {
      wsEngine: EiowsServer,
    });
    server.setMaxListeners(Infinity);
    server.on("connection", (socket) => {
      socket.setMaxListeners(Infinity);
    });
    server.listen(props.port);
    serverRef.current = server;
  }
  const server = serverRef.current;
  useEffect(() => {
    return () => {
      if (server) server.close();
    };
  }, []);
  const getProps = useCallback(() => {
    const { children, singleInstance } = props;
    return {
      transport: {
        on: (event: string, callback: (...args: any[]) => void) => {
          if (event === "connection") {
            server.on(event, callback);
          }
        },
        emit: (event: string, ...args: any[]) => {
          server.sockets.emit(event, ...args);
        },
        off: (event: string, callback: (...args: any[]) => void) => {
          server.sockets.removeListener(event, callback);
          if (event === "connection") {
            server.off(event, callback);
          }
        },
      } as Transport<any>,
      singleInstance,
      children,
    };
  }, [props.children, props.singleInstance]);
  return <ServerBase {...getProps()} />;
}

function createSocketServer(
  Server: typeof ServerBase
) {
  return (props: Props) => <SocketServer {...props} ServerBase={Server} />;
}

export {
  createSocketServer
};
