import React, { useEffect, useState } from "react";
import { ViewsProvider, Server } from "@react-fullstack/fullstack/server";
import { Views } from "@react-fullstack/demo-interfaces";
import { createSocketServer } from "@react-fullstack/fullstack-socket-server";

const SocketServer = createSocketServer(Server);

const App = () => {
  const [location, setLocation] = useState<"home" | "error" | "login">("login");
  const [feeling, setFeeling] = useState<"goood" | "bad">("goood");
  const [name, setName] = useState("");
  const [_, setNothing] = useState(0);
  const [text, setText] = useState("");
  useEffect(() => {
    const doNothing = () => {
      setTimeout(() => {
        setNothing(Math.random());
        doNothing();
      }, 1000);
    };
    doNothing();
  }, []);
  return (
    <ViewsProvider<Views>>
      {({ Home, Login, Prompt, Gif, Input, Button }) => {
        return (
          <>
            <Input onChange={setText} value={text} />
            <Button text="Click me" onClick={() => setText(text + feeling)} />
            {location === "home" && (
              <Home info={{ feeling }} moodSwing={() => {
                setFeeling(
                  feeling === "goood" ? "bad" : "goood"
                );
                console.log("moodSwing");
              }} logout={() => setLocation("login")} username={name}>
                <Gif url="https://upload.wikimedia.org/wikipedia/commons/7/78/GRACE_globe_animation.gif" />
                <Gif url="https://upload.wikimedia.org/wikipedia/commons/7/78/GRACE_globe_animation.gif" />
              </Home>
            )}
            {location === "login" && (
              <Login
                login={(username, password) => {
                  if (password === "0000") {
                    setName(username);
                    setLocation("home");
                  } else {
                    setLocation("error");
                  }
                }}
              />
            )}
            {location === "error" && (
              <Prompt
                message={"wrong password"}
                onOk={() => setLocation("login")}
              >
                <Gif url="https://upload.wikimedia.org/wikipedia/commons/7/78/GRACE_globe_animation.gif" />
              </Prompt>
            )}
          </>
        );
      }}
    </ViewsProvider>
  );
};

const ServerApp = () => (
  <>
    <SocketServer port={8585} socketOptions={{ cors: { origin: "*" } }}>
      {() => <App />}
    </SocketServer>
    <SocketServer port={8584} singleInstance socketOptions={{ cors: { origin: "*" } }}>
      {() => <App />}
    </SocketServer>
  </>
);

export default ServerApp;
