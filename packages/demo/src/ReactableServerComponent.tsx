import React from "react";
import { ReactRoute } from "@react-express/server";

interface State {
  currentPath: string;
}

console.log(__filename);

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