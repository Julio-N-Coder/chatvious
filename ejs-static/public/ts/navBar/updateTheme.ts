export default function updateTheme(
  isOSDefaultDarkMode: boolean,
  themeSwitch: HTMLInputElement,
  preferedTheme: string | null
): void {
  // checks if OS Default is Dark mode
  if (isOSDefaultDarkMode) {
    const isCurrentlyDarkMode = themeSwitch.checked;

    // checks if it is "Currently dark mode"/unckecked
    if (isCurrentlyDarkMode) {
      localStorage.setItem("theme", "light");
      preferedTheme = "light";
    } else {
      localStorage.setItem("theme", "dark");
      preferedTheme = "dark";
    }
    // else OS Default is Light mode
  } else {
    const isCurrentlyLightMode = themeSwitch.checked;

    // checks if it is "Currently light mode"/unckecked
    if (isCurrentlyLightMode) {
      localStorage.setItem("theme", "dark");
      preferedTheme = "dark";
      // checks if it is "Currently dark mode"/ckecked
    } else {
      localStorage.setItem("theme", "light");
      preferedTheme = "light";
    }
  }
}
