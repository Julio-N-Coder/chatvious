import "./styles.css";
import { createRoot } from "react-dom/client";
import React, { lazy, Suspense } from "react";
import App from "./app";
const About = lazy(() => import("./pages/about/about"));
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Container from "./Container";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Container,
    children: [
      {
        path: "about",
        element: (
          <>
            <Suspense
              fallback={<div className="container mx-auto">Loading...</div>}
            >
              <About />
            </Suspense>
          </>
        ),
      },
    ],
  },
  // flex container below is to center elements with navbar on screen
  {
    path: "/",
    element: <Container className="min-h-screen flex flex-col" />,
    children: [{ index: true, Component: App }],
  },
]);

const rootNode = document.getElementById("root");

if (!rootNode) throw new Error("Root node not found");
const root = createRoot(rootNode);

root.render(<RouterProvider router={router} />);
