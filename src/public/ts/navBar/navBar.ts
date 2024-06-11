const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
let isOSDefaultDarkMode = darkModeMediaQuery.matches;
let preferedTheme = localStorage.getItem("theme");
let isCurrentlyDarkMode = false;

// Initializing dom elements needed
const themeSwitch = document.getElementById("themeSwitch") as HTMLInputElement;

// checks OS default to rotate theme switch or not
// also changes theme switch value for dark/light mode
if (isOSDefaultDarkMode) {
  themeSwitch.value = "light";
  isCurrentlyDarkMode = true;
  // rotate themeSwitch if OS default is light mode
} else {
  themeSwitch.value = "dark";
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
      isCurrentlyDarkMode = false;
    } else {
      isCurrentlyDarkMode = true;
    }
  } else {
    if (preferedTheme === "dark") {
      isCurrentlyDarkMode = true;
    } else {
      isCurrentlyDarkMode = false;
    }
  }
}

export { themeSwitch, isOSDefaultDarkMode, preferedTheme };
