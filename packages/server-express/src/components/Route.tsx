import React from "react";
import { Application, RequestHandler } from "express";
import { ApplicationContext, RouterContext } from "../context";

export interface RouteProps {
  /**
   * the path of the route
   */
  path: string;
  /**
   * handle all requests
   */
  all?: RequestHandler;
  /**
   * handle delete request
   */
  delete?: RequestHandler;
  /**
   * handle get request
   */
  get?: RequestHandler;
  /**
   * handle post request
   */
  post?: RequestHandler;
  /**
   * handle put request
   */
  put?: RequestHandler;
}

class Route extends React.Component<RouteProps> {
  private router?: Application;

  private routerUpdateIndex = 0;

  private routerDidUpdate = () => {
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

  componentWillUnmount = () => {
	  this.routerUpdateIndex++;
  }

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

export default Route;
