import React, { useState } from "react";
import { defineRuntime } from "@react-fullstack/framework";
import { Button, Typography, Main } from "html";

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <Main>
      <Typography element="h1">Hello World - {count}</Typography>
      <Button onClick={() => setCount(count + 1)}>Click Me</Button>
    </Main>
  );
}

// this could be set to default behavior or overridden by the user
export const runtime = defineRuntime
  .withSsr()
  .withDefaultServe("/");

  