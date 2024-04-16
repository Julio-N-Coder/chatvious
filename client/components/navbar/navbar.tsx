import React, { useEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Sun, Moon } from "../sun-moon";
import { preferedAndThemeToggle, toggleDarkModeMainText } from "./themeChanger";

type NavbarProps = {
  isDarkMode?: boolean;
  setIsDarkMode?: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Navbar({ isDarkMode, setIsDarkMode }: NavbarProps) {
  const [isDefaultDarkMode, setIsDefaultDarkMode] = useState(false);
  const [preferedTheme, setPreferedTheme] = useState<"dark" | "light" | null>(
    null
  );
  const [firstRotate, setFirstRotate] = useState(false);
  const [themeChecked, setThemeChecked] = useState(false);
  const themeSwitchRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  function updateTheme() {
    if (location.pathname === "/") {
      toggleDarkModeMainText(isDefaultDarkMode, themeSwitchRef, setIsDarkMode);
    }
    preferedAndThemeToggle(
      isDefaultDarkMode,
      themeSwitchRef,
      setThemeChecked,
      setPreferedTheme
    );
  }

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    const IsOSDefaultDarkMode = darkModeMediaQuery.matches;

    setIsDefaultDarkMode(IsOSDefaultDarkMode);

    // checks OS default to rotate theme switch or not
    // and change main text color
    if (IsOSDefaultDarkMode) {
      setFirstRotate(true);
      if (setIsDarkMode != undefined) {
        setIsDarkMode(true);
      }
    }

    // check for preference with and check against default theme
    // then check theme or not depending on preference
    const preference = localStorage.getItem("theme");
    if (preference) {
      if (IsOSDefaultDarkMode) {
        if (preference === "light") {
          setPreferedTheme("light");
          setThemeChecked(true);
          if (setIsDarkMode != undefined) {
            setIsDarkMode(false);
          }
        } else {
          setPreferedTheme("dark");
        }
      } else {
        if (preference === "dark") {
          setPreferedTheme("dark");
          setThemeChecked(true);
        } else {
          setPreferedTheme("light");
          if (setIsDarkMode != undefined) {
            setIsDarkMode(false);
          }
        }
      }
    }
  }, []);

  // console.log(preferedTheme, 0, "prefered/current");
  // console.log(themeSwitchRef.current?.value, 0, "mode which will switch to");
  // console.log(localStorage.getItem("theme"), 0);
  // console.log(firstRotate, "checking if rotated");
  // console.log(themeChecked, "Is Theme checked?");

  return (
    <div className="px-2 md:px-4 lg:px-10 py-5 flex justify-between navbar bg-neutral gap-2">
      {/* left side div */}
      <div className="xsm:space-x-2">
        {/* 3 line nav icon */}
        <details className="dropdown md:hidden">
          <summary className="xsm:m-1 btn btn-ghost btn-square m-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current text-neutral-content"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </summary>
          <ul className="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-52">
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) => (isActive ? `btn-active` : ``)}
              >
                About
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? `btn-active` : ``)}
              >
                Dashboard
              </NavLink>
            </li>
          </ul>
        </details>
        <Link to="/" className="text-3xl xsm:text-4xl text-neutral-content">
          Chatvious
        </Link>
        {/* big tabs pages for big screens */}
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive
              ? `btn-active nav-tabs-lg hidden md:block`
              : `nav-tabs-lg hidden md:block`
          }
        >
          About
        </NavLink>
        {/* no page for this yet */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive
              ? `btn-active nav-tabs-lg hidden md:block`
              : `nav-tabs-lg hidden md:block`
          }
        >
          Dashboard
        </NavLink>
      </div>
      {/* right side div */}
      <div className="flex items-center">
        {/* light/dark mode toggle */}
        <label className="flex cursor-pointer gap-2 sm:mr-6">
          <Sun />
          <input
            type="checkbox"
            ref={themeSwitchRef}
            checked={themeChecked}
            value={`${isDefaultDarkMode ? "light" : "dark"}`}
            // rotate to make switch look like it's checked the same way regardless of os default. use "rotate-180"
            className={`toggle theme-controller ${firstRotate && "rotate-180"}`}
            onChange={updateTheme}
          />
          <Moon />
        </label>
        {/* header button logins / buttons not set */}
        <button className="btn btn-accent hidden sm:flex">Sign in</button>
        <p className="text-neutral-content divider divider-horizontal hidden sm:flex">
          or
        </p>
        <button className="btn btn-accent hidden sm:flex">Log in</button>
        {/* thee dots login for small screens / buttons not set */}
        <details className="dropdown dropdown-end flex sm:hidden">
          <summary className="m-1 btn btn-ghost px-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-5 h-5 stroke-current text-neutral-content"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              ></path>
            </svg>
          </summary>
          <ul className="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-52">
            <li>
              <a>Sign In</a>
            </li>
            <li>
              <a>Log In</a>
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}
