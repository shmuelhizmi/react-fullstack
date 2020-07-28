# react-express

create reactive node express servers using react!

## Example code

```tsx
import React from "react";
import express, { RequestHandler, Application } from "express";
import {
  Server,
  Route,
  Render,
  Router,
  ReactRoute,
} from "@react-express/server";
import * as path from "path";

const secret: RequestHandler = (req, res) => {
  res.send(JSON.stringify({ key: "secretKey11" }));
};

const posts = ["hey", "bey", "hello", "world 🗺"];

const post: RequestHandler = (req, res) => {
  const newPost = req.body.post;
  if (newPost && typeof newPost === "string") {
    posts.push(newPost);
  }
  return res.send(JSON.stringify(posts));
};

const use = (app: Application) => {
  app.use(express.json(), express.urlencoded({ extended: true }));
};

Render(
  <Server reference={use} listen port={2345} then={() => console.log("finish")}>
    <ReactRoute>
      <h1>Hello world</h1>
    </ReactRoute>
    <Route path="/hidden" get={secret} />
    <Router path="/posts">
      <ReactRoute rootPath="/" assetsDir={path.join(__dirname, "./../assets/")}>
        {() => (
          <html>
            <head>
              <title>the first real fullstack react app</title>
            </head>
            <body>
              <div id="app">
                <ol>
                  {posts.map((post, index) => (
                    <li
                      style={{
                        color: `#${Math.floor(
                          Math.random() * 16777215
                        ).toString(16)}`,
                      }}
                      key={index}
                    >
                      <h1>{post}</h1>
                    </li>
                  ))}
                </ol>
              </div>
              <script src="./colors.js"></script>
            </body>
          </html>
        )}
      </ReactRoute>
      <Route path="/post/:post" post={post} />
    </Router>
  </Server>
);
```
