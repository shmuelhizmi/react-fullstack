import React from "react";
import { RequestHandler } from "express";
import {
  Server,
  Route,
  Render,
  Router,
  ReactRoute,
} from "@react-express/server";

const secret: RequestHandler = (req, res) => {
  res.send(JSON.stringify({ key: "secretKey11" }));
};

const posts = ["hey", "bey"];

const post: RequestHandler = (req, res, next) => {
  const newPost = req.params.post;
  if (newPost && typeof newPost === "string") {
    posts.push(newPost);
  }
  return res.send(JSON.stringify(posts));
};

Render(
  <Server listen port={2345} then={() => console.log("finish")}>
    <ReactRoute>
      <h1>Hello world</h1>
    </ReactRoute>
    <Route path="/hidden" get={secret} />
    <Router path="/posts">
      <Router path="/colored">
        <ReactRoute path="/all">
          {() => (
            <ol>
              {posts.map((post, index) => (
                <li
                  style={{
                    color: `#${Math.floor(Math.random() * 16777215).toString(
                      16
                    )}`,
                  }}
                  key={index}
                >
                  <h1>{post}</h1>
                </li>
              ))}
            </ol>
          )}
        </ReactRoute>
      </Router>
      <ReactRoute path="/all">
        {() => (
          <ol>
            {posts.map((post, index) => (
              <li key={index}>{post}</li>
            ))}
          </ol>
        )}
      </ReactRoute>
      <Route path="/post/:post" get={post} />
    </Router>
  </Server>
);
