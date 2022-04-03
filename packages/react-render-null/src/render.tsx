import { create } from "react-test-renderer";




export const Render = (element: JSX.Element) => {
  let tree = create(element);
  return {
    stop: () => tree.unmount(),
    continue: () => tree = create(element)
  };
};
