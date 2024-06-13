import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar/navbar";
import { SignUp, LogIn } from "../components/sign-up-log-in";
import { signOut, checkAuthStatus } from "../lib/auth";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthStatus(setIsLoggedIn);
  }, []);

  return (
    <div className="flex flex-col h-screen antialiased">
      <Navbar setIsDarkMode={setIsDarkMode} isDarkMode={isDarkMode} />
      {/* Main */}
      <div className="grow flex flex-col justify-center items-center gap-y-4">
        {/* Main title */}
        <div className="relative flex justify-center items-center">
          <div className="absolute -z-10 title-shadow w-full"></div>
          <h1
            className={`font-bold text-7xl xsm:text-8xl sm:text-9xl ${
              isDarkMode && "text-white"
            }`}
          >
            Chatvious
          </h1>
        </div>
        <div className="space-x-6">
          {isLoggedIn ? (
            <button className="btn btn-accent" onClick={signOut}>
              Log Out
            </button>
          ) : (
            <>
              <SignUp className="btn btn-accent" />
              <LogIn className="btn btn-accent" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
