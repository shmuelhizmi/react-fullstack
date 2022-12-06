import React, { useCallback, useEffect, useRef } from "react";
import SocketIO from "socket.io";
import { Transport } from "@react-fullstack/fullstack/shared";
import type { Server as ServerBase, ServerProps } from "@react-fullstack/fullstack/server";
import type { Server as HTTPServer } from "http";

interface Props extends Pick<ServerProps<any, any>, 'children' | 'singleInstance' | 'instanceRenderHandler'> {
  /**
   * The port the socket will run on.
   */
  port?: number;
  /**
   * pass existing http server to socket.io
   */
  server?: HTTPServer;
  /**
   * socket.io server options, note: must be passed with the first component mount, updating this prop will have no effect.
   * Note: cors header does not default to "*"
   */
  socketOptions?: Partial<SocketIO.ServerOptions>;
}

function SocketServer(props: Props & { ServerBase: typeof ServerBase }) {
  const { ServerBase } = props;
  const serverRef = useRef<SocketIO.Server<any, any>>();
  if (!serverRef.current) {
    const server = props.server
      ? new SocketIO.Server(props.server, props.socketOptions)
      : new SocketIO.Server(props.socketOptions);
    server.setMaxListeners(Infinity);
    server.on("connection", (socket) => {
      socket.setMaxListeners(Infinity);
    });
    if (!props.server) {
      if (!props.port) {
        throw new Error("port is required when server is not passed");
      }
      server.listen(props.port);
    }
    serverRef.current = server;
  }
  const server = serverRef.current;
  useEffect(() => {
    return () => {
      if (server) server.close();
    };
  }, []);
  const getProps = useCallback(() => {
    const { children, singleInstance, instanceRenderHandler } = props;
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
      instanceRenderHandler,
    };
  }, [props.children, props.singleInstance]);
  return <ServerBase {...getProps()} />;
}

function createSocketServer(Server: typeof ServerBase) {
  return (props: Props) => <SocketServer {...props} ServerBase={Server} />;
}

export { createSocketServer };
