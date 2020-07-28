import React from "react";
import ReactDom from "react-dom/server";
import { Route } from "@react-express/server-core";
import { RequestHandler } from "express";

interface ReactRouteProps {
  path?: string;
  children: (() => React.ReactNode) | React.ReactNode;
}

class ReactRoute extends React.Component<ReactRouteProps> {
  private get: RequestHandler = (_req, res) => {
    let reactNodes: React.ReactNode;
    if (typeof this.props.children === "function") {
      reactNodes = (this.props.children as () => React.ReactNode)();
    } else {
      reactNodes = this.props.children;
    }
    res.send(ReactDom.renderToString(<>{reactNodes}</>));
  };

  render() {
    return <Route path={this.props.path || "/"} get={this.get} />;
  }
}

export default ReactRoute;
