import React, { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Sun, Moon } from "../sun-moon";
import { SignUp, LogIn } from "../../components/sign-up-log-in";
import { signOut, checkAuthStatus } from "../../lib/auth";

export default function Navbar() {
  const themeSwitchRef = useRef<HTMLInputElement>(
    null
  ) as React.RefObject<HTMLInputElement>;
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function themeToggle() {
    if (localStorage.theme === "dark") {
      document.documentElement.dataset.theme = "light";
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.dataset.theme = "dark";
      localStorage.setItem("theme", "dark");
    }
  }

  useEffect(() => {
    checkAuthStatus(setIsLoggedIn);
  }, []);

  return (
    <nav className="px-2 md:px-4 lg:px-10 py-4 flex justify-between navbar bg-base-300 gap-2">
      {/* left side div */}
      <div className="flex xsm:gap-2 items-center">
        {/* 3 line nav icon */}
        <details className="dropdown md:hidden">
          <summary className="xsm:m-1 btn btn-ghost btn-square m-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current text-base-content"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </summary>
          <ul className="p-2 shadow-sm menu dropdown-content z-1 bg-base-100 rounded-box w-52">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? `bg-neutral text-neutral-content` : ``
                }
              >
                Chatvious
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  isActive ? `bg-neutral text-neutral-content` : ``
                }
              >
                About
              </NavLink>
            </li>
            <li>
              <a
                href={`${
                  process.env.IS_DEV_SERVER
                    ? "http://localhost:3000"
                    : process.env.DOMAIN_URL
                }/dashboard`}
              >
                Dashboard
              </a>
            </li>
          </ul>
        </details>
        <NavLink
          to="/"
          className="text-3xl xsm:text-4xl text-base-content hidden md:inline"
        >
          Chatvious
        </NavLink>
        {/* big tabs pages for big screens */}
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? `btn-active nav-tabs-lg` : `nav-tabs-lg`
          }
        >
          About
        </NavLink>
        <a
          href={`${
            process.env.IS_DEV_SERVER
              ? "http://localhost:3000"
              : process.env.DOMAIN_URL
          }/dashboard`}
          className="nav-tabs-lg"
        >
          DashBoard
        </a>
      </div>
      {/* right side div */}
      <div className="flex items-center">
        {/* light/dark mode toggle */}
        <label className="flex cursor-pointer gap-2 sm:mr-6">
          <Sun />
          <input
            type="checkbox"
            ref={themeSwitchRef}
            // rotate to make switch look like it's checked the same way regardless of theme
            className={`toggle ${localStorage.theme == "dark" && "rotate-180"}`}
            onChange={themeToggle}
          />
          <Moon />
        </label>
        {/* header button logins */}
        {isLoggedIn ? (
          <button onClick={signOut} className="btn btn-accent hidden sm:flex">
            Log Out
          </button>
        ) : (
          <>
            <SignUp className="btn btn-accent hidden sm:flex" />
            <p className="text-neutral-content divider divider-horizontal hidden sm:flex">
              or
            </p>
            <LogIn className="btn btn-accent hidden sm:flex" />
          </>
        )}
        {/* thee dots login for small screens / buttons */}
        <details className="dropdown dropdown-end flex sm:hidden">
          <summary className="m-1 btn btn-ghost px-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-5 h-5 stroke-current text-base-content"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              ></path>
            </svg>
          </summary>
          <ul className="p-2 shadow-sm menu dropdown-content z-1 bg-base-100 rounded-box w-52">
            {isLoggedIn ? (
              <p onClick={signOut}>Log Out</p>
            ) : (
              <>
                <li>
                  <SignUp />
                </li>
                <li>
                  <LogIn />
                </li>
              </>
            )}
          </ul>
        </details>
      </div>
    </nav>
  );
}
