import React from "react";
import { Socket } from "socket.io";
import { NamespaceContext } from "../context";

interface RoomProps {
  room: string;
  onJoin?: (socket: Socket) => void;
  children?: React.ReactNode;
}

class Room extends React.Component<RoomProps> {
  renderIndex = 0;
  render() {
    this.renderIndex++;
    const currentRenderIndex = this.renderIndex;
    return (
      <NamespaceContext.Consumer>
        {(namespace) => {
          if (namespace) {
            const roomNamespace = namespace.in(this.props.room);
            roomNamespace.on(
              "connection",
              () => this.renderIndex === currentRenderIndex && this.props.onJoin
            );
            return (
              <NamespaceContext.Provider value={roomNamespace}>
                {this.props.children}
              </NamespaceContext.Provider>
            );
          }
          return <></>;
        }}
      </NamespaceContext.Consumer>
    );
  }
}
export default Room;
