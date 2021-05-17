import React, { useState } from "react";
import { ViewsProvider } from "@react-fullstack/fullstack";
import { Views } from "@react-fullstack/demo-interfaces";
import { Server } from "@react-fullstack/fullstack-socket-server";

const App = () => {
  const [location, setLocation] = useState<"home" | "error" | "login">("login");
  const [name, setName] = useState("");
  return (
    <ViewsProvider<typeof Views>>
      {({ Home, Login, Prompt, Gif }) => {
        return (
          <>
            {location === "home" && (
              <Home logout={() => setLocation("login")} username={name}>
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
                message={"worng password"}
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
  <Server port={8585} socketOptions={{ cors: { origin: "*" } }} views={Views}>
    {() => <App />}
  </Server>
);

export default ServerApp;
