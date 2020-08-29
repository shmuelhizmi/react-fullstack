import React from "react";
import { Component } from "@react-fullstack/fullstack";
import { Views } from "@react-fullstack/demo-interfaces";

class Gif extends Component<typeof Views["Gif"]> {
  render() {
    return (
      <div>
        <img src={this.props.url} />
      </div>
    );
  }
}
export default Gif;