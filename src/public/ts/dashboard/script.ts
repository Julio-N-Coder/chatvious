import "../../css/styles.css";
import {
  themeSwitch,
  isOSDefaultDarkMode,
  preferedTheme,
} from "../navBar/navBar";
import updateTheme from "../navBar/updateTheme";
import { signOut } from "./token-checker";

// adding Event listeners
themeSwitch.addEventListener("change", () => {
  updateTheme(isOSDefaultDarkMode, themeSwitch, preferedTheme);
});

document.querySelector("#sign-out-button")?.addEventListener("click", signOut);

// tokenChecker();
