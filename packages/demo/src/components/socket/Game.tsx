import React from "react";
import {
  Component,
  On,
  Connection,
  Socket,
} from "@react-fullstack/server-socket";

class Game extends Component {
  scores: { [socketId: string]: number } = {};
  score = (socket: Socket, score: number) => {
    if (!this.scores[socket.id]) {
      this.scores[socket.id] = 0;
    }
    this.scores[socket.id] += score;
  };
  render() {
    return (
      <>
        <Connection>
          {(socket) => {
            return (
              <On<number>
                event="score"
                handler={(score) => this.score(socket, score)}
              />
            );
          }}
        </Connection>
      </>
    );
  }
}

export default Game;