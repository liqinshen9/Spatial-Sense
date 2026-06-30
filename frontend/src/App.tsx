import { useEffect, useState } from "react";

function App() {
  //useState returns the current state value and a function to update it
  const [message, setMessage] = useState("Loading...");//start with message = "Loading", then give a function called setMessage to change it later
  const [error, setError] = useState("");

  //here React runs a useEffect hook that sends a fetch request to the backend endpoint http://localhost:5000/api/message
  useEffect(() => {
    fetch("http://localhost:5000/api/message")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        return response.json();
      })
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setError("Could not connect to backend. Make sure the backend is running.");
      });
  }, []);

  return (
    //min-h-screen: make the dark title area at least the full screen height
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <h1 className="text-xl font-semibold">Spatial Sense</h1>
      {/*If error has value, show the error message in red. Otherwise, show normal message.*/}
      {error ? (<p className="text-red-400">{error}</p>) : (<p className="text-slate-200">{message}</p>)}
    </main>
  );
}

export default App;