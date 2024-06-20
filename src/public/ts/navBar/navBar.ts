import updateTheme from "./updateTheme";
import { signOut } from "../dashboard/token-checker";

const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
let isOSDefaultDarkMode = darkModeMediaQuery.matches;
let preferedTheme = localStorage.getItem("theme");
let isCurrentlyDarkMode = false;

// Initializing dom elements needed
const themeSwitch = document.getElementById("themeSwitch") as HTMLInputElement;

themeSwitch.addEventListener("change", () => {
  updateTheme(isOSDefaultDarkMode, themeSwitch, preferedTheme);
});

const signOutButtons = document.getElementsByClassName("sign-out-button");
for (let i = 0; i < signOutButtons.length; i++) {
  signOutButtons[i].addEventListener("click", signOut);
}

// checks OS default to rotate theme switch or not
// also changes theme switch value for dark/light mode
if (isOSDefaultDarkMode) {
  themeSwitch.value = "light";
  // rotate themeSwitch if OS default is light mode
} else {
  themeSwitch.value = "dark";
  themeSwitch.className = themeSwitch.className.slice(
    0,
    themeSwitch.className.indexOf("rotate-180")
  );
}

// check for os theme, then check preference to turn on switch or not.
if (preferedTheme) {
  if (isOSDefaultDarkMode) {
    if (preferedTheme === "light") {
      themeSwitch.checked = true;
      isCurrentlyDarkMode = false;
    } else {
      isCurrentlyDarkMode = true;
    }
  } else {
    if (preferedTheme === "dark") {
      themeSwitch.checked = true;
      isCurrentlyDarkMode = true;
    } else {
      isCurrentlyDarkMode = false;
    }
  }
}
