import React from "react";
import { NamespaceContext } from "../context";
import { Namespace } from "socket.io";

interface OnProps<Data = any> {
  handler?: (data: Data) => void;
  children?: (data: Data) => React.ReactNode;
  event: string;
  off?: boolean;
}

interface OnState {
  children?: React.ReactNode;
}

class On<Data> extends React.Component<OnProps<Data>, OnState> {
  state: OnState = {};

  private onUpdateIndex = 0;

  private onDidUpdate = (namespace?: Namespace) => {
    this.onUpdateIndex++;
    if (namespace) {
      const updateIndex = this.onUpdateIndex;
      namespace.on(this.props.event, (data: Data) => {
        if (this.onUpdateIndex === updateIndex) {
          if (this.props.children) {
            this.setState({ children: this.props.children(data) });
          }
          if (this.props.handler) this.props.handler(data);
        }
      });
    }
  };

  componentWillUnmount = () => {
    this.onUpdateIndex++;
  };

  render() {
    return (
      <NamespaceContext.Consumer>
        {(namespace) => {
          this.onDidUpdate(namespace);
          return this.state.children;
        }}
      </NamespaceContext.Consumer>
    );
  }
}

export default On;
