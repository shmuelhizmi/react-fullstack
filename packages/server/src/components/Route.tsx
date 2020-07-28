import React from "react";
import { Application, RequestHandler } from "express";
import { ApplicationContext, RouterContext } from "../context";

export interface RouteProps {
  path: string;
  all?: RequestHandler;
  delete?: RequestHandler;
  get?: RequestHandler;
  post?: RequestHandler;
  put?: RequestHandler;
}

class Route extends React.Component<RouteProps> {
  private router?: Application;
  private isMouted = false;

  private routerUpdateIndex = 0;

  routerDidUpdate = () => {
    if (this.router) {
      this.routerUpdateIndex++;
      const currentRouterUpdateIndex = this.routerUpdateIndex;
      const { path, all, delete: deleteRoute, get, post, put } = this.props;
      this.router.all(path, (req, response, next) => {
        if (currentRouterUpdateIndex === this.routerUpdateIndex && all) {
          all(req, response, next);
        } else {
          next();
        }
      });
      this.router.delete(path, (req, response, next) => {
        if (currentRouterUpdateIndex === this.routerUpdateIndex && deleteRoute) {
          deleteRoute(req, response, next);
        } else {
          next();
        }
      });
      this.router.get(path, (req, response, next) => {
        if (currentRouterUpdateIndex === this.routerUpdateIndex && get) {
          get(req, response, next);
        } else {
          next();
        }
      });
      this.router.post(path, (req, response, next) => {
        if (currentRouterUpdateIndex === this.routerUpdateIndex && post) {
          post(req, response, next);
        } else {
          next();
        }
      });
      this.router.put(path, (req, response, next) => {
        if (currentRouterUpdateIndex === this.routerUpdateIndex && put) {
          put(req, response, next);
        } else {
          next();
        }
      });
    }
  };

  render() {
    return (
      <ApplicationContext.Consumer>
        {(app) => {
          return (
            <RouterContext.Consumer>
              {(router) => {
                if ((app || router) && !this.isMouted) {
                  const newRouter = (router || app) as Application;
                  this.router = newRouter;
                  this.isMouted = true;
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

export default Route;
