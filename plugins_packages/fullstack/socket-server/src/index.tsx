import React from "react";
// @ts-ignore
import { Views } from "@react-fullstack/fullstack/lib/Views";
// @ts-ignore
import App from "@react-fullstack/fullstack/lib/App";
import SocketIO from "socket.io";

interface Props<ViewsInterface extends Views> {
  port: number;
  children: () => JSX.Element;
  views: ViewsInterface;
}

class Server<ViewsInterface extends Views> extends React.Component<
  Props<ViewsInterface>
> {
  server?: SocketIO.Server;
  componentDidMount = () => {
    this.server = SocketIO(this.props.port);

    this.server.on("connection", (socket) => {
      const app = new App({
        reactTree: this.props.children,
        transport: socket,
        views: this.props.views,
      });
      app.start();
    });
  };
  render = () => <></>;
}

export { Server };
