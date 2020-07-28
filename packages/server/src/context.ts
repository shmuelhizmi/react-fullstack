import React from "react";
import { Application, Router } from 'express'

export const ApplicationContext = React.createContext<Application | undefined>(undefined);
export const RouterContext = React.createContext<Router | undefined>(undefined);