import React from "react";
import { Views } from "@react-fullstack/demo-interfaces";
import { Client } from "@react-fullstack/fullstack-socket-client";
import * as Components from "./components";

function App() {
  if (window.location.pathname.includes("single")) {
    return (
      <Client<Views> host="localhost" port={8584} views={Components} />
    );
  }
  return (
    <Client<Views> host="localhost" port={8585} views={Components} />
  );
}

export default App;
