import React from "react";
import { Views, ViewsToComponents } from "@react-fullstack/fullstack/lib/Views";
import { Client as ClientBase } from "@react-fullstack/fullstack";
import { connect } from "socket.io-client";

interface Props<ViewsInterface extends Views> {
  /**
   * port of the server you want to connect to
   * @example 5000
   */
  port: number;
  /**
   * host of the server you want to connect to
   * @example localhost
   */
  host: string;
  /**
   * client views that the server can use to render your app
   */
  views: ViewsToComponents<ViewsInterface>;
}

class Client<ViewsInterface extends Views> extends React.Component<
  Props<ViewsInterface>
> {
  socket = connect(`${this.props.host}:${this.props.port}`, {
    transports: ["websocket"],
  });
  componentDidMount = () => {
    this.socket.on("connect", () => {
      this.socket.emit("request_views_tree");
    });
  };
  render = () => (
    <ClientBase<ViewsInterface>
      transport={this.socket}
      views={this.props.views}
    />
  );
}

export { Client };
