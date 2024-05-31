import "./styles.css";
// import "./fonts/Roboto-Regular.ttf";
import { createRoot } from "react-dom/client";
import React, { lazy, Suspense } from "react";
import App from "./app";
const About = lazy(() => import("./about/about"));
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Navbar from "../components/navbar/navbar";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/about",
    element: (
      <>
        <Navbar />
        <Suspense
          fallback={<div className="container mx-auto">Loading...</div>}
        >
          <About />
        </Suspense>
      </>
    ),
  },
]);

const rootNode = document.getElementById("root");

if (!rootNode) throw new Error("Root node not found");
const root = createRoot(rootNode);

root.render(<RouterProvider router={router} />);
