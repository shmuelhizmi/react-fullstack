import React from "react";
import type SocketIO from "socket.io";
import { Views } from "../Views";
import App from "../App";

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
    this.server = require("socket.io")() as SocketIO.Server;
    this.server.listen(this.props.port);
    this.server.on("connection", (socket) => {
      const app = new App({
        reactTree: this.props.children,
        socket,
        views: this.props.views,
      });
      app.start();
    });
  };
  render = () => <></>;
}

export default Server;
