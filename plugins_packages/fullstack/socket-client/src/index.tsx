import React from "react";
// @ts-ignore
import { Views, ViewsToComponents } from "@react-fullstack/fullstack/lib/Views";
// @ts-ignore
import { Client as ClientBase } from "@react-fullstack/fullstack";
import { connect } from "socket.io-client";

interface Props<ViewsInterface extends Views> {
  port: number;
  host: string;
  views: ViewsToComponents<ViewsInterface>;
}

class Client<ViewsInterface extends Views> extends React.Component<
  Props<ViewsInterface>
> {
  socket = connect(`${this.props.host}:${this.props.port}`);
  render = () => <ClientBase<ViewsInterface> transport={this.socket} views={this.props.views} />
}

export { Client };
