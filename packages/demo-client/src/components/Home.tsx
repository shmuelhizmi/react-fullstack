import React from "react";
import { Component } from "@react-fullstack/fullstack";
import { Views } from "@react-fullstack/demo-interfaces";

class Home extends Component<typeof Views["Home"]> {
  render() {
    return (
      <div>
        <h1>Hello - {this.props.username}</h1>
        {this.props.children}
        <button onClick={() => this.props.logout()}>logout</button>
      </div>
    );
  }
}
export default Home;