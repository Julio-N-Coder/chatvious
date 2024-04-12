import "./styles.css";
// import "./fonts/Roboto-Regular.ttf";
import { createRoot } from "react-dom/client";
import React from "react";
import App from "./app";

const rootNode = document.getElementById("root");

if (!rootNode) throw new Error("Root node not found");
const root = createRoot(rootNode);

// render later
root.render(<App />);
