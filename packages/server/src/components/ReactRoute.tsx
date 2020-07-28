import React from "react";
import ReactDom from "react-dom/server";
import { Route, Router } from "@react-express/server-core";
import express, { RequestHandler } from "express";

interface ReactRouteProps {
  rootPath?: string;
  assetsDir?: string;
  children: (() => React.ReactNode) | React.ReactNode;
}

class ReactRoute extends React.Component<ReactRouteProps> {
  private getApp: RequestHandler = (_req, res) => {
    let reactNodes: React.ReactNode;
    if (typeof this.props.children === "function") {
      reactNodes = (this.props.children as () => React.ReactNode)();
    } else {
      reactNodes = this.props.children;
    }
    res.send(ReactDom.renderToString(<>{reactNodes}</>));
  };

  serveStaticFiles = (router: express.Router) => {
    if (this.props.assetsDir) router.use(express.static(this.props.assetsDir));
  };

  render() {
    return (
      <Router
        reference={this.serveStaticFiles}
        path={this.props.rootPath || "/"}
      >
        <Route path="/" get={this.getApp} />
      </Router>
    );
  }
}

export default ReactRoute;
