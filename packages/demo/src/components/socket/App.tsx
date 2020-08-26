import React from "react";
import { Server, Connection, Room } from "@react-fullstack/server-socket";
import Game from "./Game";

const App = () => {
  return (
    <Server listen port={5432}>
      <Connection onConnection={(socket) => socket.join("game")} />
      <Room room="game">
        <Game />
      </Room>
    </Server>
  );
};
