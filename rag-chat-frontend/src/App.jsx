import { useState } from "react";
import "./App.css"; // Ensure to create this file with the given CSS

function App() {
  const [url, setUrl] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! How can I assist you today?" },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMessage("");
    setError("");

    try {
      const response = await fetch(
        "http://localhost:3000/api/scrape-and-store",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }
      );

      if (response.ok) {
        setResponseMessage("Success");
      } else {
        const data = await response.json();
        throw new Error(data.message || "Something went wrong");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = { sender: "user", text: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      const response = await fetch(
        "http://localhost:3000/api/generate-response",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: inputMessage }),
        }
      );

      const data = await response.json();
      const botMessage = {
        sender: "bot",
        text: data.response || "No response",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error fetching response." },
      ]);
    }
  };

  return (
    <div className="container">
      <h1 className="main-heading">Web Scraper & AI Responder</h1>
      <h2 className="sub-heading">Paste a URL in the input box below</h2>

      <form onSubmit={handleSubmit} className="url-input-div">
        <input
          className="submit-box"
          type="url"
          placeholder="Enter a URL to scrape"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button className="submit-btn" type="submit" disabled={loading}>
          {loading ? "Scraping..." : "Submit"}
        </button>
      </form>
      {responseMessage && <p className="success-message">{responseMessage}</p>}
      {error && <p className="error-message">{error}</p>}

      <h2 className="sub-heading">Ask your questions to AI</h2>
      <div className="chat-container">
        <div className="chat-window">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={msg.sender === "user" ? "right-msg" : "left-msg"}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleChatSubmit} className="chat-input-container">
          <input
            className="chat-input"
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            required
          />
          <button className="send-btn" type="submit">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;

// import { useState } from "react";

// function App() {
//   const [url, setUrl] = useState("");
//   const [responseMessage, setResponseMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [inputMessage, setInputMessage] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setResponseMessage("");
//     setError("");

//     try {
//       const response = await fetch(
//         "http://localhost:3000/api/scrape-and-store",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ url }),
//         }
//       );

//       if (response.ok) {
//         setResponseMessage("Success");
//       } else {
//         const data = await response.json();
//         throw new Error(data.message || "Something went wrong");
//       }
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChatSubmit = async (e) => {
//     e.preventDefault();
//     if (!inputMessage.trim()) return;

//     const userMessage = { sender: "user", text: inputMessage };
//     setMessages((prev) => [...prev, userMessage]);
//     setInputMessage("");

//     try {
//       const response = await fetch(
//         "http://localhost:3000/api/generate-response",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ query: inputMessage }),
//         }
//       );

//       const data = await response.json();
//       const botMessage = {
//         sender: "bot",
//         text: data.response || "No response",
//       };
//       setMessages((prev) => [...prev, botMessage]);
//     } catch (err) {
//       setMessages((prev) => [
//         ...prev,
//         { sender: "bot", text: "Error fetching response." },
//       ]);
//     }
//   };

//   return (
//     <div style={{ textAlign: "center", padding: "2rem" }}>
//       <h1>Web Scraper & Chat</h1>

//       {/* Scraper Section */}
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Enter URL"
//           value={url}
//           onChange={(e) => setUrl(e.target.value)}
//           required
//           style={{ padding: "10px", width: "300px", marginRight: "10px" }}
//         />
//         <button type="submit" disabled={loading} style={{ padding: "10px" }}>
//           {loading ? "Scraping..." : "Scrape & Store"}
//         </button>
//       </form>
//       {responseMessage && (
//         <p style={{ color: "green", marginTop: "10px" }}>{responseMessage}</p>
//       )}
//       {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

//       {/* Chat Section */}
//       <div
//         style={{
//           marginTop: "2rem",
//           padding: "1rem",
//           border: "1px solid #ccc",
//           width: "400px",
//           marginInline: "auto",
//           borderRadius: "8px",
//         }}
//       >
//         <h2>Chat</h2>
//         <div
//           style={{
//             height: "300px",
//             overflowY: "auto",
//             borderBottom: "1px solid #ccc",
//             paddingBottom: "10px",
//           }}
//         >
//           {messages.map((msg, index) => (
//             <p
//               key={index}
//               style={{
//                 textAlign: msg.sender === "user" ? "right" : "left",
//                 margin: "5px 0",
//               }}
//             >
//               <strong>{msg.sender === "user" ? "You:" : "Bot:"}</strong>{" "}
//               {msg.text}
//             </p>
//           ))}
//         </div>
//         <form onSubmit={handleChatSubmit} style={{ marginTop: "10px" }}>
//           <input
//             type="text"
//             placeholder="Type a message..."
//             value={inputMessage}
//             onChange={(e) => setInputMessage(e.target.value)}
//             required
//             style={{ padding: "10px", width: "250px", marginRight: "10px" }}
//           />
//           <button type="submit" style={{ padding: "10px" }}>
//             Send
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default App;
