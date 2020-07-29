import React from "react";
import express, { RequestHandler, Application } from "express";
import {
  Server,
  Route,
  Render,
  Router,
  ReactRoute,
  Middleware,
} from "@react-express/server";
import * as path from "path";
import ReactableServer from './ReactableServerComponent'

const helloWorldJson: RequestHandler = (req, res) => {
  res.send({ hello: "world" });
};

const posts = ["hey", "bey", "hello", "world 🗺"];

const post: RequestHandler = (req, res) => {
  const newPost = req.body.post;
  if (newPost && typeof newPost === "string") {
    posts.push(newPost);
  }
  return res.send(posts);
};

Render(
  <Server listen port={2345} then={() => console.log("finish")}>
    <Middleware
      middlewares={[(express.json(), express.urlencoded({ extended: true }))]}
    />
    <ReactRoute>
      <h1>Hello world</h1>
    </ReactRoute>
    <Route path="/hello-world" get={helloWorldJson} />
	<ReactableServer />
    <Router path="/posts">
      <Route path="/post" post={post} />
      <ReactRoute indexPath={"/:id"}>
        {(req) => (
          <h1
            style={{
              color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            }}
          >
			  {posts[Number(req.params.id)] || "not found!"}
		  </h1>
        )}
      </ReactRoute>
      <ReactRoute
        indexPath={"/*"}
        assetsDir={path.join(__dirname, "./../assets/")}
      >
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
                      <h2>{post}</h2>
                    </li>
                  ))}
                </ol>
              </div>
              <script src="./colors.js"></script>
              <script></script>
            </body>
          </html>
        )}
      </ReactRoute>
    </Router>
  </Server>
);
