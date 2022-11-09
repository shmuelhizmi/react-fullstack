import React from "react";
import express, { Application } from "express";
import { Server as HTTPServer } from "http";
import { ApplicationContext } from "../context";

export interface ServerProps extends React.PropsWithChildren<{}> {
  reference?: (appRef: Application, httpServerRef?: HTTPServer) => void;
  then?: () => void;
  port: number;
  listen: boolean;
}

class Server extends React.Component<ServerProps> {
  private app: Application = express();
  private server?: HTTPServer;

  constructor(props: Server["props"]) {
    super(props);
    if (props.listen && props.port) {
      this.server = this.app.listen(this.props.port);
      if (props.then) this.server.on("close", props.then);
      if (props.reference) props.reference(this.app, this.server);
    }
  }

  shouldComponentUpdate = (nextProps: Server["props"]) => {
    if (
      nextProps.listen !== this.props.listen ||
      nextProps.port !== this.props.port
    ) {
      if (nextProps.listen !== this.props.listen && !nextProps.listen) {
        if (this.server) this.server.close();
      }
      if (nextProps.port !== this.props.port) {
        if (nextProps.listen) {
          if (this.props.listen) {
            if (this.server) this.server.close();
          }
          this.server = this.app.listen(nextProps.port);
          if (this.props.then) this.server.on("close", this.props.then);
        }
      } else {
        if (nextProps.listen !== this.props.listen && nextProps.listen) {
          this.server = this.app.listen(nextProps.port);
          if (this.props.then) this.server.on("close", this.props.then);
        }
      }
    }

    if (!this.props.reference && nextProps.reference) {
      nextProps.reference(this.app, this.server);
    }
    this.app.listen();

    return false;
  };

  componentWillUnmount = () => {
    if (this.server) this.server.close();
  }

  render() {
    return (
      <ApplicationContext.Provider value={this.app}>
        {this.props.children}
      </ApplicationContext.Provider>
    );
  }
}

export default Server;
