import React from "react";

export type TypographyElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span";
export interface TypographyProps {
  children: React.ReactNode;
  element?: TypographyElement;
}

export function Typography({ children, element = "p" }: TypographyProps) {
  return React.createElement(element, {}, children);
}
