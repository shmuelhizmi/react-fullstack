import React from "react";
import { App, Views } from "@react-fullstack/fullstack";
import { Transport } from "@react-fullstack/fullstack/lib/types";
import SocketIO from "socket.io";

interface Props<ViewsInterface extends Views> {
  /**
   * The port the socket will run on.
   */
  port: number;
  /**
   * The server react app
   */
  children: () => JSX.Element;
  /**
   * Object containing view shared component
   */
  views: ViewsInterface;
  /**
   * share one app across all clients.
   */
  singleInstance?: boolean;
  /**
   * socket.io server options, note: must be passed with the first component mount, updating this prop will have no effect.
   * Note: cors header does not default to "*"
   */
  socketOptions?: Partial<SocketIO.ServerOptions>;
}

interface State<ViewsInterface extends Views> {
  apps: { [id: string]: SocketIO.Socket };
}

/**
 * "@react-fullstack/fullstack" socket server
 */
class Server<ViewsInterface extends Views> extends React.Component<
  Props<ViewsInterface>,
  State<ViewsInterface>
> {
  server: SocketIO.Server;
  mainAppRef?: App<ViewsInterface>;
  constructor(props: Props<ViewsInterface>) {
    super(props);
    this.server = new SocketIO.Server(this.props.socketOptions);
  }

  state: State<ViewsInterface> = { apps: {} };

  componentDidMount = () => {
    this.server.sockets.setMaxListeners(0);
    this.server.on("connection", (socket) => {
      if (this.props.singleInstance) {
        if (this.mainAppRef) {
          socket.setMaxListeners(0);
          this.mainAppRef.addClient(socket as Transport<any>);
          socket.on("disconnect", () => {
            if (this.mainAppRef) {
              this.mainAppRef.removeClient(socket as Transport<any>);
            }
          });
        }
      } else {
        const { id } = socket;
        this.state.apps[id] = socket;
        this.forceUpdate();
        socket.on("disconnect", () => {
          delete this.state.apps[id];
          this.forceUpdate();
        });
      }
    });
    this.server.listen(this.props.port);
  };

  componentWillUnmount = () => {
    if (this.server) this.server.close();
  };

  render = () => (
    <>
      <App<ViewsInterface>
        ref={(app) => { this.mainAppRef = app || undefined }}
        children={this.props.children}
        paused={!this.props.singleInstance}
        views={this.props.views}
        transportIsClient={false}
        transport={this.server.sockets as Transport<any>}
        />
      {Object.entries(this.state.apps).map(([id, socket]) => (
        <App<ViewsInterface>
          key={id}
          paused={false}
          transportIsClient
          children={this.props.children}
          views={this.props.views}
          transport={socket as Transport<any>}
        />
      ))}
    </>
  );
}

export { Server };
