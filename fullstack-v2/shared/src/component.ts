import { createElement, useContext, useEffect, useState, FunctionComponent, ReactNode } from "react";
import { ClassicFullStackComponent, FunctionalFullStackComponent } from ".";
import { ParentClientViewContext } from "./context";

export function AsComponent<
  Component extends
    | FunctionalFullStackComponent<any>
    | ClassicFullStackComponent<any, any>
>(component: Component) {
  const handler = function (
    props: Component extends FunctionalFullStackComponent<infer Props>
      ? Props
      : Component extends ClassicFullStackComponent<infer Props, any>
      ? Props
      : { children: ReactNode[]; }
  ) {
    const [compoenntId, setComponentId] = useState<string | null>(null);
    const parent = useContext(ParentClientViewContext);
    useEffect(() => {
      if (parent) {
        const id = parent.registerNewComponent(
          parent.parentId,
          (component as Function).name,
          props
        );
        setComponentId(id);
        return () => {
            parent.deleteExistingComponent(id);
        }
      }
    }, []);
    useEffect(() => {
        if (parent && compoenntId) {
            parent.updateExistingComponent(compoenntId, props);
        }
    })
    if (!parent) {
        return createElement(component as FunctionComponent<typeof props>, props);
    }
    return props.children;
  };
}
