import React from "react";
import ReactDom from "react-dom/server";
// @ts-ignore
import { Route, Router, Middleware } from "@react-fullstack/server-express";
import express, { RequestHandler, Request, Response, NextFunction } from "express";

type RequestToReactNode = (req: Request, res: Response, next: NextFunction) => React.ReactNode;

interface ReactRouteProps {
  /**
   * the root path that your assets and indexPath will be relative to.
   * @default rootPath={"/"}
   */
  rootPath?: string;
  /**
   * the path for your index - your react app will be render to rootPath/indexPath
   * @default indexPath={"/"}
   */
  indexPath?: string;
  /**
   * Assets directory absolute path
   * @example assetsDir={path.join(__dirname, "./../assets")}
   * @default none
   */
  assetsDir?: string;
  /**
   * Function that return JSX Elements to render to the client
   * @example
   * ```tsx
   * (req) => <h1>{req.body.title}</h1>
   * ```
   */
  children: RequestToReactNode | React.ReactNode;
}

class ReactRoute extends React.Component<ReactRouteProps> {
  private getApp: RequestHandler = (req, res, next) => {
    let reactNodes: React.ReactNode;
    if (typeof this.props.children === "function") {
      reactNodes = (this.props.children as RequestToReactNode)(req, res, next);
    } else {
      reactNodes = this.props.children;
    }
    res.send(ReactDom.renderToString(<>{reactNodes}</>));
  };

  render() {
    return (
      <Router path={this.props.rootPath || "/"}>
        {this.props.assetsDir && (
          <Middleware
            middlewares={[express.static(this.props.assetsDir, { index: "/" })]}
          />
        )}
        <Route path={this.props.indexPath || "/"} get={this.getApp} />
      </Router>
    );
  }
}

export default ReactRoute;
