export function preferedAndThemeToggle(
  isDefaultDarkMode: boolean,
  themeSwitchRef: React.RefObject<HTMLInputElement>,
  setThemeChecked: React.Dispatch<React.SetStateAction<boolean>>,
  setPreferedTheme: React.Dispatch<
    React.SetStateAction<"dark" | "light" | null>
  >
) {
  // checks if OS Default is Dark mode
  if (isDefaultDarkMode && themeSwitchRef.current) {
    const isCurrentlyDarkMode = themeSwitchRef.current.checked;

    // checks if it is "Currently dark mode"/unckecked
    if (isCurrentlyDarkMode) {
      setThemeChecked(true);
      setPreferedTheme("light");
      localStorage.setItem("theme", "light");
      // checks if it is "Currently light mode"/ckecked
    } else {
      setThemeChecked(false);
      setPreferedTheme("dark");
      localStorage.setItem("theme", "dark");
    }
    // else OS Default is Light mode
  } else {
    // checks if it is "Currently light mode"/unckecked
    if (themeSwitchRef.current) {
      const isCurrentlyLightMode = themeSwitchRef.current.checked;

      if (isCurrentlyLightMode) {
        setThemeChecked(true);
        setPreferedTheme("dark");
        localStorage.setItem("theme", "dark");
        // checks if it is "Currently dark mode"/ckecked
      } else {
        setThemeChecked(false);
        setPreferedTheme("light");
        localStorage.setItem("theme", "light");
      }
    }
  }
}

// to change main text title white if dark mode
export function toggleDarkModeMainText(
  isDefaultDarkMode: boolean,
  themeSwitchRef: React.RefObject<HTMLInputElement>,
  setIsDarkMode?: React.Dispatch<React.SetStateAction<boolean>>
) {
  // checks if OS Default is Dark mode
  if (isDefaultDarkMode && themeSwitchRef.current) {
    const isCurrentlyDarkMode = themeSwitchRef.current.checked;

    // checks if it is "Currently dark mode"/unckecked
    if (isCurrentlyDarkMode) {
      if (setIsDarkMode != undefined) {
        setIsDarkMode(false);
      }
      // checks if it is "Currently light mode"/ckecked
    } else {
      if (setIsDarkMode != undefined) {
        setIsDarkMode(true);
      }
    }
    // else OS Default is Light mode
  } else {
    // checks if it is "Currently light mode"/unckecked
    if (themeSwitchRef.current) {
      const isCurrentlyLightMode = themeSwitchRef.current.checked;

      if (isCurrentlyLightMode) {
        if (setIsDarkMode != undefined) {
          setIsDarkMode(true);
        }
        // checks if it is "Currently dark mode"/ckecked
      } else {
        if (setIsDarkMode != undefined) {
          setIsDarkMode(false);
        }
      }
    }
  }
}
