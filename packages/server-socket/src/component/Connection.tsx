import React from "react";
import {
  ServerContext,
  SocketConnectionContext,
  NamespaceContext,
} from "../context";
import { Socket, Server } from "socket.io";

interface ConnectionProps {
  onConnection?: (socket: Socket) => void;
  children?: (socket: Socket) => React.ReactNode;
}

interface ConnectionState {
  connections: { socket: Socket; id: string; children: React.ReactNode }[];
}

class Connection extends React.Component<ConnectionProps, ConnectionState> {
  state: ConnectionState = {
    connections: [],
  };

  static contextType = ServerContext;

  componentDidMount = () => {
    const server = this.context as Server;
    server.on("connection", (socket) => {
      if (this.props.onConnection) this.props.onConnection(socket);
      if (this.props.children) {
        this.setState((state) => {
          if (this.props.children) {
            state.connections.push({
              socket,
              id: socket.id,
              children: this.props.children(socket),
            });

            return {
              connections: state.connections.filter(
                (connection) => !connection.socket.disconnected
              ),
            };
          }
        });
      }
    });
  };
  render() {
    return (
      <React.Fragment>
        {this.state.connections.map((connection) => (
          <React.Fragment key={connection.id}>
            <SocketConnectionContext.Provider value={connection.socket}>
              <NamespaceContext.Provider value={connection.socket.nsp}>
                {connection.children}
              </NamespaceContext.Provider>
            </SocketConnectionContext.Provider>
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  }
}

export default Connection;
