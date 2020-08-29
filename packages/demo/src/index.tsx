import React from "react";
import HTTPServer from "./components/http/App";
import { Render } from "@react-fullstack/render";
import FullStackServer from "./components/fullstack/App";

Render(
  <>
    <HTTPServer />
    <FullStackServer />
  </>
);
