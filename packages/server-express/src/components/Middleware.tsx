import React from "react";
import { Application, RequestHandler } from "express";
import { ApplicationContext, RouterContext } from "../context";

export interface MiddlewareProps extends React.PropsWithChildren<{}> {
  /**
   * the path the middleware will handle
   */
  path?: string;
  /**
   * middlewares to use.
   * @see {@link http://expressjs.com/en/4x/api.html#middleware-callback-function-examples}
   */
  middlewares: RequestHandler[];
}

class Middleware extends React.Component<MiddlewareProps> {
  private router?: Application;

  private routerUpdateIndex = 0;

  routerDidUpdate = () => {
    if (this.router) {
      this.routerUpdateIndex++;
      const currentRouterUpdateIndex = this.routerUpdateIndex;
      const { path, middlewares } = this.props;
      const resultMiddlewares = middlewares.map((originalMiddleware) => {
        const middleware: RequestHandler = (req, res, next) => {
          if (currentRouterUpdateIndex === this.routerUpdateIndex) {
            originalMiddleware(req, res, next);
          }
        };
        return middleware;
      });
      if (path) {
        this.router.use(path, ...resultMiddlewares);
      } else {
        this.router.use(...resultMiddlewares);
      }
    }
  };

  render() {
    return (
      <ApplicationContext.Consumer>
        {(app) => {
          return (
            <RouterContext.Consumer>
              {(router) => {
                if (app || router) {
                  this.router = (router || app) as Application;
                }
                this.routerDidUpdate();
                return this.props.children;
              }}
            </RouterContext.Consumer>
          );
        }}
      </ApplicationContext.Consumer>
    );
  }
}

export default Middleware;
