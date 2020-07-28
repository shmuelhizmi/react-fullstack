# react-express

create reactive node express servers using react!

## Example code

```typescript
import React from "react";
import { RequestHandler } from "express";
import { Server, Route, Render, Router } from "@react-express/server";

const hellowWorld: RequestHandler = (req, res) => {
  res.send("<h1>Hello world</h1>");
};
const secret: RequestHandler = (req, res) => {
  res.send("<h1>Hello world</h1>");
};

const posts = ["hey", "bey"];

const getPosts: RequestHandler = (req, res) => res.send(JSON.stringify(posts));

const post: RequestHandler = (req, res, next) => {
  const newPost = req.params.post;
  if (newPost && typeof newPost === "string") {
    posts.push(newPost);
  }
  return getPosts(req, res, next);
};

Render(
  <Server listen port={2345} then={() => console.log("finish")}>
    <Route path="/" get={hellowWorld} />
    <Route path="/hidden" get={secret} />
    <Router path="/posts">
      <Route path="/all" get={getPosts} />
      <Route path="/post/:post" get={post} />
    </Router>
  </Server>
);
```
