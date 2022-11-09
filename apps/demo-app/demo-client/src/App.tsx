import React from "react";
import { Views } from "@react-fullstack/demo-interfaces";
import { Client } from "@react-fullstack/fullstack-socket-client";
import * as Components from "./components";

function App() {
  return (
    <Client<typeof Views> host="localhost" port={8585} views={Components} />
  );
}

export default App;
