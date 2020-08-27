import React, { useEffect, useState } from "react";
import { connect } from "socket.io-client";

const server = connect("http://localhost:5432");

function App() {
  const [scores, setScores] = useState<Record<string, number>>({});
  useEffect(() => {
    server.on("scores", (newScores: Record<string, number>) => {
      console.log(newScores);
      setScores(newScores);
    });
    return () => {
      server.disconnect();
    };
  }, []);
  return (
    <div className="App">
      <ol>
        {Object.keys(scores).map((name) => (
          <li>
            {name} : {scores[name]}
          </li>
        ))}
      </ol>
      <button onClick={() => server.emit("score", 10)} >score</button>
    </div>
  );
}

export default App;
