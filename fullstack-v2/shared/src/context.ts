import { createContext } from "react";
import { ParentClientViewProvider } from ".";

export const ParentClientViewContext = createContext<
  ParentClientViewProvider | undefined
>(undefined);
