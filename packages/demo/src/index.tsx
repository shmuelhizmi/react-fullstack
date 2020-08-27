import React from "react";
import HTTPServer from "./components/http/App";
import { Render } from "@react-fullstack/render";
import SocketServer from "./components/socket/App";

Render(
  <>
    <HTTPServer />
    <SocketServer />
  </>
);
