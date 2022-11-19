import React from "react";
import type App from "./App";

export const AppContext = React.createContext<App | undefined>(undefined);
