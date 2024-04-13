import "./styles.css";
// import "./fonts/Roboto-Regular.ttf";
import { createRoot } from "react-dom/client";
import React, { lazy, Suspense } from "react";
import App from "./app";
const About = lazy(() => import("./about/about"));
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/about",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <About />
      </Suspense>
    ),
  },
]);

const rootNode = document.getElementById("root");

if (!rootNode) throw new Error("Root node not found");
const root = createRoot(rootNode);

root.render(<RouterProvider router={router} />);
