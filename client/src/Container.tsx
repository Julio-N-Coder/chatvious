import React from "react";
import Navbar from "./components/navbar/navbar";
import { Outlet } from "react-router";

export default function Container({ className }: { className?: string }) {
  return (
    <div className={`antialiased ${className}`}>
      <Navbar />
      <Outlet />
    </div>
  );
}
