import React from "react";
import { defineRuntime, useRoute } from "@react-fullstack/framework";
import { Button, Typography, NavigationBar } from "html";

export default function NavBar() {
  const [count, setCount] = useRoute(0);
  return (
    <NavigationBar>
      <Typography element="h1">Hello World - {count}</Typography>
      <Button onClick={() => setCount(count + 1)}>Home</Button>
    </NavigationBar>
  );
}

// this could be set to default behavior or overridden by the user
export const runtime = defineRuntime
  .withSsr()
  .withDefaultServe("/");

  