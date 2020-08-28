import React, { useState } from "react";
import { Server, ViewsProvider } from "@react-fullstack/fullstack";
import { Views } from "@react-fullstack/demo-interfaces";

const App = () => {
  const [location, setLocation] = useState<"home" | "error" | "login">("login");
  const [name, setName] = useState("");
  return (
    <Server port={5454} views={Views}>
      {() => (
        <ViewsProvider<typeof Views>>
          {({ Home, Login, Prompt }) => {
            switch (location) {
              case "home": {
                return (
                  <Home logout={() => setLocation("login")} username={name} />
                );
              }
              case "login": {
                return (
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
                );
              }
              case "error": {
                return (
                  <Prompt
                    message={"worng password"}
                    onOk={() => setLocation("login")}
                  />
                );
              }
            }
          }}
        </ViewsProvider>
      )}
    </Server>
  );
};

export default App;