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
    <div className="px-10 py-5 flex justify-between bg-neutral items-center">
      {/* left side div */}
      <div className="space-x-4">
        <Link to="/" className="text-4xl text-neutral-content">
          Chatvious
        </Link>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive
              ? "btn-active btn-ghost p-2 rounded-lg text-neutral-content text-2xl"
              : "btn-ghost p-2 rounded-lg text-neutral-content text-2xl"
          }
        >
          About
        </NavLink>
      </div>
      {/* right side div */}
      <div className="flex items-center">
        {/* light/dark mode toggle */}
        <label className="flex cursor-pointer gap-2 mr-6">
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
        {/* header button logins */}
        <button className="btn btn-accent">Sign in</button>
        <p className="text-neutral-content divider divider-horizontal">or</p>
        <button className="btn btn-accent">Log in</button>
      </div>
    </div>
  );
}
