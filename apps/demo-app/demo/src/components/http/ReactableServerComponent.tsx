import React from "react";
import { ReactRoute } from "@react-fullstack/plugin-server-side-rendering";

interface State {
  currentPath: string;
}

class ReactableServer extends React.Component<{}, State> {
  state: State = {
    currentPath: "startingPath",
  };
  render = () => (
    <ReactRoute indexPath={`/${this.state.currentPath}/:newPath`}>
      {(req) => {
        this.setState({ currentPath: req.params.newPath });
        return <h1>the next hidden path is - {req.params.newPath}</h1>;
      }}
    </ReactRoute>
  );
}

export default ReactableServer;