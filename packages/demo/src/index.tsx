import React from "react";
import HTTPServer from "./components/http/App";
import { Render } from "@react-fullstack/render";
import SocketServer from "./components/socket/App";
import FullStackServer from "./components/fullstack/App";

Render(
  <>
    <HTTPServer />
    <SocketServer />
    <FullStackServer />
  </>
);
