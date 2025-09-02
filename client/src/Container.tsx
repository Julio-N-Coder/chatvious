import React from "react";
import Navbar from "../components/navbar/navbar";
import { Outlet } from "react-router";

export default function Container() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
