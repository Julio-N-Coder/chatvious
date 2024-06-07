import updateTheme from "./updateTheme";

const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
let isOSDefaultDarkMode = darkModeMediaQuery.matches;
let preferedTheme = localStorage.getItem("theme");
let isCurrentlyDarkMode: boolean;
let firstRotate = false;

// Initializing dom elements needed
const themeSwitch = document.getElementById("themeSwitch") as HTMLInputElement;

// adding theme Switch Event listener
themeSwitch.addEventListener("change", () => {
  updateTheme(isOSDefaultDarkMode, themeSwitch);
});

// checks OS default to rotate theme switch or not
if (isOSDefaultDarkMode) {
  firstRotate = true;
  isCurrentlyDarkMode = true;
}

// check for preference with and check against default theme
// then check theme or not depending on preference
if (preferedTheme) {
  if (isOSDefaultDarkMode) {
    if (preferedTheme === "light") {
      preferedTheme = "light";
      themeSwitch.checked = true;
      isCurrentlyDarkMode = false;
    } else {
      preferedTheme = "dark";
    }
  } else {
    if (preferedTheme === "dark") {
      preferedTheme = "dark";
      themeSwitch.checked = true;
    } else {
      preferedTheme = "light";
      isCurrentlyDarkMode = false;
    }
  }
}

// setting themeSwitch className to rotate it or not
let themeSwitchClassName = "toggle theme-controller";
firstRotate && (themeSwitchClassName += " rotate-180");
themeSwitch.className = themeSwitchClassName;
console.log("is this running?");
export { themeSwitch, isOSDefaultDarkMode };
