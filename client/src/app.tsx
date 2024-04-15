import React, { ReactNode, ReactElement, useState } from "react";
import Navbar from "../components/navbar/navbar";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="flex flex-col h-screen roboto antialiased">
      <Navbar setIsDarkMode={setIsDarkMode} isDarkMode={isDarkMode} />
      {/* Main */}
      <div className="grow flex flex-col justify-center items-center gap-y-4">
        {/* Main title */}
        <div className="relative flex justify-center items-center">
          <div className="absolute -z-10 title-shadow w-full"></div>
          <h1 className={`font-bold text-9xl ${isDarkMode && "text-white"}`}>
            Chatvious
          </h1>
        </div>
        <div className="space-x-6">
          <button className="btn btn-accent">Sign in</button>
          <button className="btn btn-accent">Log in</button>
        </div>
      </div>
    </div>
  );
}
