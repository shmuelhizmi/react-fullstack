/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { Component } from "@react-fullstack/fullstack/client";
import { Views } from "@react-fullstack/demo-interfaces";

class Home extends Component<typeof Views["Home"]> {
  render() {
    return (
      <div>
        <h1>Hello - {this.props.username} are you felling <a href="#" onClick={() => this.props.moodSwing()}>{this.props.info.feeling}</a></h1>
        {this.props.children}
        <button onClick={() => this.props.logout()}>logout</button>
      </div>
    );
  }
}
export default Home;