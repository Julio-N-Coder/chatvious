export default function updateTheme(
  isOSDefaultDarkMode: boolean,
  themeSwitch: HTMLInputElement
): void {
  // checks if OS Default is Dark mode
  if (isOSDefaultDarkMode) {
    const isCurrentlyDarkMode = themeSwitch.checked;

    // checks if it is "Currently dark mode"/unckecked
    if (isCurrentlyDarkMode) {
      themeSwitch.checked = true;
      localStorage.setItem("theme", "light");
      themeSwitch?.setAttribute("value", "light");
      // checks if it is "Currently light mode"/ckecked
    } else {
      themeSwitch.checked = false;
      localStorage.setItem("theme", "dark");
      themeSwitch?.setAttribute("value", "dark");
      // else OS Default is Light mode
    }
  } else {
    const isCurrentlyLightMode = themeSwitch.checked;

    // checks if it is "Currently light mode"/unckecked
    if (isCurrentlyLightMode) {
      themeSwitch.checked = true;
      localStorage.setItem("theme", "dark");
      themeSwitch?.setAttribute("value", "dark");
      // checks if it is "Currently dark mode"/ckecked
    } else {
      themeSwitch.checked = false;
      localStorage.setItem("theme", "light");
      themeSwitch?.setAttribute("value", "light");
    }
  }
}
