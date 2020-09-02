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

    if (this.props.singleInstance) {
      const app = new App({
        reactTree: this.props.children,
        views: this.props.views,
      });
      app.startServer(this.server);
      this.server.on("connection", (socket) => {
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
  render = () => <></>;
}

export { Server };
