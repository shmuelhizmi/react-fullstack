import React, { useEffect, useState } from "react";
import {
  ViewsProvider,
  Server,
  createInstanceRenderHandler,
  ServerInstanceRenderHandler,
} from "@react-fullstack/fullstack/server";
import { Views } from "@react-fullstack/demo-interfaces";
import { createSocketServer } from "@react-fullstack/fullstack-socket-server";
import { createServer, Server as HTTPServer } from "http";
import { renderToString } from "react-dom/server";

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
              <Home
                info={{ feeling }}
                moodSwing={() => {
                  setFeeling(feeling === "goood" ? "bad" : "goood");
                  console.log("moodSwing");
                }}
                logout={() => setLocation("login")}
                username={name}
              >
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

const treePreviewNode = ({ name, children }: any) => {
  return (
    <li>
      {name}
      {children && <ul>{children.map(treePreviewNode)}</ul>}
    </li>
  );
};

const previewRenderProxy = new Proxy({} as any, {
  get: (target, prop) => {
    return (
      target[prop] ||
      (target[prop] = (props: any) => {
        return treePreviewNode({ name: prop, children: props.children });
      })
    );
  },
});

const ServerApp = () => {
  const serverInstanceRenderHandlerRef =
    React.useRef<ServerInstanceRenderHandler>();
  if (!serverInstanceRenderHandlerRef.current) {
    serverInstanceRenderHandlerRef.current = createInstanceRenderHandler();
  }
  const httpRef = React.useRef<HTTPServer>();
  if (!httpRef.current) {
    httpRef.current = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        renderToString(
          serverInstanceRenderHandlerRef.current?.render(
            previewRenderProxy
          ) || <p>Unable to render. {":("}</p>
        )
      );
    });
    httpRef.current.listen(8584);
  }

  return (
    <>
      <SocketServer port={8585} socketOptions={{ cors: { origin: "*" } }}>
        {() => <App />}
      </SocketServer>
      <SocketServer
        server={httpRef.current}
        singleInstance
        socketOptions={{ cors: { origin: "*" } }}
        instanceRenderHandler={serverInstanceRenderHandlerRef.current}
      >
        {() => <App />}
      </SocketServer>
    </>
  );
};

export default ServerApp;
