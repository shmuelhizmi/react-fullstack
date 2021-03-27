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
  /**
   * socket.io client options, note: must be passed with the first component mount, updating this prop will have no effect.
   */
  socketOptions?: SocketIOClient.ConnectOpts;
}

class Client<ViewsInterface extends Views> extends React.Component<
  Props<ViewsInterface>
> {
  socket!: SocketIOClient.Socket;

  componentDidMount = () => {
    this.socket = connect(
      `${this.props.host}:${this.props.port}`,
      this.props.socketOptions
    );
    this.socket.on("connect", () => {
      this.socket.emit("request_views_tree");
    });
  };
  componentWillUnmount = () => {
    this.socket.close();
  };
  render = () =>
    this.socket ? (
      <ClientBase<ViewsInterface>
        transport={this.socket}
        views={this.props.views}
      />
    ) : (
      <> </>
    );
}

export { Client };
