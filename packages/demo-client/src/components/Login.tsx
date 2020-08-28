import React from "react";
import { Component } from "@react-fullstack/fullstack";
import { Views } from "@react-fullstack/demo-interfaces";

class Login extends Component<typeof Views["Login"], { username: string; password: string }> {
  render() {
    return (
      <div>
        <input type="text" onChange={(e) => this.setState({ username: e.target.value })} placeholder="username" />
        <input type="text" onChange={(e) => this.setState({ password: e.target.value })} placeholder="password" />
		<button onClick={() => this.props.login(this.state.username, this.state.password)}>LogIn</button>
	  </div>
    );
  }
}
export default Login;
