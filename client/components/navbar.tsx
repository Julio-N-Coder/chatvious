import React, { useEffect, useState, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { Sun, Moon } from "../components/sun-moon";

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

  function toggleDarkMode() {
    if (setIsDarkMode != undefined) {
      setIsDarkMode(!isDarkMode);
    }
  }

  // change name to one like function above. maybe swap them
  function preferedThemeToggle() {
    if (isDefaultDarkMode && themeSwitchRef.current) {
      const isCurrentlyDarkMode = themeSwitchRef.current.checked;

      if (isCurrentlyDarkMode) {
        console.log("currently dark mode");
        setThemeChecked(true);
        setPreferedTheme("light");
        localStorage.setItem("theme", "light");
      } else {
        console.log("currently light mode");
        setThemeChecked(false);
        setPreferedTheme("dark");
        localStorage.setItem("theme", "dark");
      }
    } else {
      if (themeSwitchRef.current) {
        const isCurrentlyLightMode = themeSwitchRef.current.checked;

        if (isCurrentlyLightMode) {
          setThemeChecked(true);
          setPreferedTheme("dark");
          localStorage.setItem("theme", "dark");
        } else {
          setThemeChecked(false);
          setPreferedTheme("light");
          localStorage.setItem("theme", "light");
        }
      }
    }
  }

  useEffect(() => {
    console.log("in Effect");
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    const IsOSDefaultDarkMode = darkModeMediaQuery.matches;
    if (setIsDarkMode != undefined) {
      setIsDarkMode(IsOSDefaultDarkMode);
    }

    setIsDefaultDarkMode(IsOSDefaultDarkMode);

    // will need to check against default for correct switch order
    if (IsOSDefaultDarkMode) {
      setFirstRotate(true);
    }

    // check for preference with and check against default theme
    // then check theme or not depending on preference
    const preference = localStorage.getItem("theme");
    if (preference) {
      if (IsOSDefaultDarkMode) {
        if (preference === "light") {
          setPreferedTheme("light");
          setThemeChecked(true);
          console.log("light");
        } else {
          setPreferedTheme("dark");
        }
      } else {
        if (preference === "dark") {
          setPreferedTheme("dark");
          setThemeChecked(true);
        } else {
          setPreferedTheme("light");
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
            onChange={() => {
              toggleDarkMode();
              preferedThemeToggle();
            }}
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
