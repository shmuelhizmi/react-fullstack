import React from "react";
import express, { Application } from 'express'

export const ApplicationContext = React.createContext<Application | undefined>(undefined);
export const RouterContext = React.createContext<express.Router | undefined>(undefined);