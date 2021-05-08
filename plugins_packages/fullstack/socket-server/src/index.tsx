import React from "react";
import { App, Views } from "@react-fullstack/fullstack";
import { AppTransport } from "@react-fullstack/fullstack/lib/types";
import SocketIO from "socket.io";
import { Server as HTTPServer, createServer } from 'http'
interface Props<ViewsInterface extends Views> {
  /**
   * The port the socket will run on.
   */
  port: number;
  /**
   * The server react app
   */
  children: () => JSX.Element;
  /**
   * Object containing view shared component
   */
  views: ViewsInterface;
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

/**
 * "@react-fullstack/fullstack" socket server
 */
class Server<ViewsInterface extends Views> extends React.Component<
  Props<ViewsInterface>
> {
  server?: SocketIO.Server;
  app!: App<ViewsInterface>;

  componentDidMount = () => {
    this.server = new SocketIO.Server(this.props.socketOptions);
    this.server.sockets.setMaxListeners(0);
    if (this.props.singleInstance) {
      this.app = new App({
        reactTree: this.props.children,
        views: this.props.views,
      });
      this.app.startServer(this.server.sockets as AppTransport);
      this.server.on("connection", (socket) => {
        socket.setMaxListeners(0);
        this.app.addClient(socket as AppTransport);
        socket.on("disconnect", () => {
          this.app.removeClient(socket as AppTransport);
        });
      });
    } else {
      this.server.on("connection", (socket) => {
        const app = new App({
          reactTree: this.props.children,
          views: this.props.views,
        });
        app.startServer(socket as AppTransport);
        app.addClient(socket as AppTransport);
        socket.on("disconnect", () => {
          app.removeClient(socket as AppTransport);
          app.close();
        });
      });
    }
    this.server.listen(this.props.port);
  };

  componentWillUnmount = () => {
    if (this.server) this.server.close();
    if (this.app) this.app.close();
  };

  render = () => <></>;
}

export { Server };
