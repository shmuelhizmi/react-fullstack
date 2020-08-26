import React from "react";
import { NamespaceContext } from "../context";
import { Socket } from "socket.io";
import { DefaultEventType } from "../types";

abstract class Component<
  Props extends object = {},
  State extends object = {},
  EmitEvents extends DefaultEventType = DefaultEventType
> extends React.Component<State, Props> {
  static contextType = NamespaceContext;

  protected get socket() {
    return this.context as Socket;
  }

  protected emit = <Event extends keyof EmitEvents>(
    event: Event,
    data: EmitEvents[Event]
  ) => this.socket.emit(String(event), data);
}

export default Component;
