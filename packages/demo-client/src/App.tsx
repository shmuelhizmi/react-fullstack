import React from "react";
import { Client } from "@react-fullstack/fullstack";
import { Views } from "@react-fullstack/demo-interfaces";
import * as Components from "./components";

function App() {
  return <Client<typeof Views> host="localhost" port={8485} views={Components} />;
}

export default App;
