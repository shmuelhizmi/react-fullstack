// @ts-ignore
import Reconciler from "react-reconciler";

const defaultOptions = {
  host: "localhost",
  port: 8097,
  websocket: undefined,
};

export function connectReactDevtools(reconciler: any) {
  // @ts-ignore
  global.window = global.window || global;
  // @ts-ignore
  global.WebSocket = global.WebSocket || require("ws");
  const { connectToDevTools } = require("react-devtools-core");

  connectToDevTools(defaultOptions);
  reconciler.injectIntoDevTools({
    bundleType: 1,
    version: "1.0.0",
    rendererPackageName: "react-fullstack-renderer",
    findHostInstanceByFiber: reconciler.findHostInstance,
  });
}

export default Reconciler({
  appendInitialChild() {},
  createInstance() {},
  createTextInstance() {},
  finalizeInitialChildren() {},
  getPublicInstance() {},
  prepareForCommit() {},
  prepareUpdate() {},
  resetAfterCommit() {},
  resetTextContent() {},
  getRootHostContext() {},
  getChildHostContext() {},
  shouldSetTextContent() {},
  now: () => {},
  supportsMutation: false,
});
