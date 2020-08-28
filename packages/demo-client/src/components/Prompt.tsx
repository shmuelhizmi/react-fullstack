import React from "react";
import { Component } from "@react-fullstack/fullstack";
import { Views } from "@react-fullstack/demo-interfaces";

class Prompt extends Component<typeof Views["Prompt"]> {
  render() {
    return (
      <div>
        <h1>{this.props.message}</h1>
        <button onClick={() => this.props.onOk()}>ok</button>
      </div>
    );
  }
}
export default Prompt;