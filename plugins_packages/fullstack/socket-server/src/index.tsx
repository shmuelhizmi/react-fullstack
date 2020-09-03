import React from "react";
// @ts-ignore
import { App, Views } from "@react-fullstack/fullstack";
import SocketIO from "socket.io";

interface Props<ViewsInterface extends Views> {
  port: number;
  children: () => JSX.Element;
  views: ViewsInterface;
  /**
   * share one app across all clients
   */
  singleInstance?: boolean;
}

class Server<ViewsInterface extends Views> extends React.Component<
  Props<ViewsInterface>
> {
  server?: SocketIO.Server;
  componentDidMount = () => {
    this.server = SocketIO(this.props.port);
    this.server.sockets.setMaxListeners(0);
    if (this.props.singleInstance) {
      const app = new App({
        reactTree: this.props.children,
        views: this.props.views,
      });
      app.startServer(this.server.sockets);
      this.server.on("connection", (socket) => {
        socket.setMaxListeners(0);
        app.addClient(socket);
      });

    } else {
      this.server.on("connection", (socket) => {
        const app = new App({
          reactTree: this.props.children,
          views: this.props.views,
        });
        app.startServer(socket);
        app.addClient(socket);
      });
    }
  };
  componentWillUnmount = () => {
    if (this.server) this.server.close();
  }
  render = () => <></>;
}

export { Server };
