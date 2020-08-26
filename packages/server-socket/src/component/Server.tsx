import React from "react";
import io, { Server as SocketServer } from "socket.io";
import { Server as HTTPServer, createServer } from "http";
import { ServerContext, NamespaceContext } from "../context";

export interface ServerProps {
  reference?: (appRef: SocketServer, httpServerRef?: HTTPServer) => void;
  then?: () => void;
  port: number;
  listen: boolean;
}

class Server extends React.Component<ServerProps> {
  private app: SocketServer = io();
  private server?: HTTPServer;

  constructor(props: Server["props"]) {
    super(props);
    if (props.listen && props.port) {
      this.createServer();
    }
  }

  createServer = () => {
    const { port, then, reference } = this.props;
    this.server = createServer();
    this.server.listen(port);
    this.app.listen(this.server);
    if (then) this.server.on("close", then);
    if (reference) reference(this.app, this.server);
  };

  shouldComponentUpdate = (nextProps: Server["props"]) => {
    if (
      nextProps.listen !== this.props.listen ||
      nextProps.port !== this.props.port
    ) {
      if (nextProps.listen !== this.props.listen && !nextProps.listen) {
        if (this.server) this.server.close();
      }
      if (nextProps.port !== this.props.port) {
        if (nextProps.listen) {
          if (this.props.listen) {
            if (this.server) this.server.close();
          }
          this.createServer();
        }
      } else {
        if (nextProps.listen !== this.props.listen && nextProps.listen) {
          this.createServer();
        }
      }
    }

    if (!this.props.reference && nextProps.reference) {
      nextProps.reference(this.app, this.server);
    }

    return false;
  };

  render() {
    return (
      <ServerContext.Provider value={this.app}>
        <NamespaceContext.Provider value={this.app.sockets}>
          {this.props.children}
        </NamespaceContext.Provider>
      </ServerContext.Provider>
    );
  }
}

export default Server;
