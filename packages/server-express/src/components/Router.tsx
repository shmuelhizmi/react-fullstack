import React from "react";
import express, { Application } from "express";
import { ApplicationContext, RouterContext } from "../context";

export interface RouterProps {
  routerDefaultOptions?: express.RouterOptions;
  path: string;
  reference?: (routerRef: express.Router) => void;
}

class Router extends React.Component<RouterProps> {
  private router?: express.Router;

  render() {
    return (
      <ApplicationContext.Consumer>
        {(app) => {
          return (
            <RouterContext.Consumer>
              {(router) => {
                if (app) {
				  this.router = express.Router();
                  (router || app).use(this.props.path, this.router);
                  if (this.props.reference) this.props.reference(this.router);
                }
                return (
                  <RouterContext.Provider value={this.router}>
                    {this.props.children}
                  </RouterContext.Provider>
                );
              }}
            </RouterContext.Consumer>
          );
        }}
      </ApplicationContext.Consumer>
    );
  }
}

export default Router;
