const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
let isOSDefaultDarkMode = darkModeMediaQuery.matches;
console.log(isOSDefaultDarkMode);
let preferedTheme = localStorage.getItem("theme");
let isCurrentlyDarkMode = false;

// Initializing dom elements needed
const themeSwitch = document.getElementById("themeSwitch") as HTMLInputElement;

// checks OS default to rotate theme switch or not
if (isOSDefaultDarkMode) {
  isCurrentlyDarkMode = true;
  console.log("is dark mode?");
  // rotate themeSwitch if OS default is light mode
} else {
  themeSwitch.className = themeSwitch.className.slice(
    0,
    themeSwitch.className.indexOf("rotate-180")
  );
}

// check for preference with and check against default theme
// then check theme or not depending on preference
if (preferedTheme) {
  if (isOSDefaultDarkMode) {
    if (preferedTheme === "light") {
      // preferedTheme = "light";
      // themeSwitch.checked = true;
      isCurrentlyDarkMode = false;
    } else {
      isCurrentlyDarkMode = true;
    }
  } else {
    if (preferedTheme === "dark") {
      // preferedTheme = "dark";
      // themeSwitch.checked = true;
    } else {
      // preferedTheme = "light";
      isCurrentlyDarkMode = false;
    }
  }
}

export { themeSwitch, isOSDefaultDarkMode, preferedTheme };
