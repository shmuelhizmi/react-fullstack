import React from "react";
import { Server, Socket, Namespace } from 'socket.io'

export const ServerContext = React.createContext<Server | undefined>(undefined);
export const SocketConnectionContext = React.createContext<Socket | undefined>(undefined);
export const NamespaceContext = React.createContext<Namespace | undefined>(undefined);
