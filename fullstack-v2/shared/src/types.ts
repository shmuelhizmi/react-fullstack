import { FunctionComponent, ClassicComponent, ReactNode } from "react";

export type FunctionalFullStackComponent<Props extends Record<string, any>> =
  FunctionComponent<ToRemoteProps<Props>>;

export type ClassicFullStackComponent<Props extends Record<string, any>, State extends Record<string, any>> =
ClassicComponent<ToRemoteProps<Props>, State>;


export type ToRemoteProps<Props extends Record<string, any>> = {
  [PropName in keyof Props]: Props[PropName] extends (
    ...any: any
  ) => infer ReturnType
    ? (...params: Parameters<Props[PropName]>) => Promise<ReturnType>
    : Props[PropName];
} & { children: ReactNode[]; };


export type ParentClientViewProvider = {
  parentId: string;
  registerNewComponent(parentId: string, name: string, initialProps: Record<string, any>): string;
  updateExistingComponent(id: string, newProps: Record<string, any>): void;
  deleteExistingComponent(id: string): void;
};