import React from "react";
import { Views } from "../shared";
import { AppContext } from "./contexts";
import { ViewsToServerComponents } from "./types";
import ViewComponent from "./ViewComponent";

export const viewProxy = new Proxy({} as Record<string, any>, {
  get: (target, name) => {
    if (typeof name !== 'string') {
      throw new Error('trying to access a view with a non string name');
    }
    if (!target[name]) {
      target[name] = (props: any) => {
        return (
          <ViewComponent name={name} props={props} />
        )
      }
    }
    return target[name];
  }
}) as any;

export const ViewsProvider = <ViewsInterface extends Views>(props: {
  children: (views: ViewsToServerComponents<ViewsInterface>) => JSX.Element;
}) => {
  return (
    <AppContext.Consumer>
      {(app) => {
        if (!app) {
          return;
        }
        return props.children(viewProxy);
      }}
    </AppContext.Consumer>
  );
};

export function deeplyEqual(x: any, y: any) {
  if (x === y) {
    return true;
  }
  if (typeof x == "object" && x != null && typeof y == "object" && y != null) {
    if (Object.keys(x).length != Object.keys(y).length) return false
    for (var prop in x) {
      if (y.hasOwnProperty(prop)) {
        if (!deeplyEqual(x[prop], y[prop])) return false;
      } else {
        return false;
      }
    }
    return true;
  }
  return false;
}