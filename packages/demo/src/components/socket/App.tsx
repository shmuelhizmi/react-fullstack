import React from "react";
import { Server, Connection, Room, On } from "@react-fullstack/server-socket";
import Game from "./Game";

const SocketServer = () => {
  return (
    <Server listen port={5432}>
      <Game />
      <On event="score" handler={() => console.log("someone score")} />
    </Server>
  );
};

export default SocketServer;
