import updateTheme from "./updateTheme";
import { signOut } from "../dashboard/token-checker";

// for some reason, scripts are not running
console.log("test");

const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
let isOSDefaultDarkMode = darkModeMediaQuery.matches;
let preferedTheme = localStorage.getItem("theme");
let isCurrentlyDarkMode = false;

// Initializing dom elements needed
const themeSwitch = document.getElementById("themeSwitch") as HTMLInputElement;
const profile = document.getElementById("profile") as HTMLDivElement;

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

const roomJoinRequests = document.getElementsByClassName("roomJoinRequests");
const notification = document.getElementById("notification") as HTMLDivElement;
const joinReqeustsRoomIDs = Array.from(roomJoinRequests).map((el) => {
  return el.getAttribute("data-roomid") as string;
});
const joinReqeustLocal = JSON.parse(
  localStorage.getItem("roomJoinRequests") || "{}"
) as { [index: string]: "NEW" | "SEEN" };

const RoomIDs = Object.keys(joinReqeustLocal);

// compare to roomJoinRequests elements to see if request is not there anymore remove if not
if (RoomIDs.length) {
  for (let i = 0; i < RoomIDs.length; i++) {
    if (!joinReqeustsRoomIDs.includes(RoomIDs[i])) {
      delete joinReqeustLocal[RoomIDs[i]];
    }
  }
}

// check if roomJoinRequests has new request not in storage
// if it does, store it with "NEW" value
if (joinReqeustsRoomIDs.length) {
  for (const RoomID of joinReqeustsRoomIDs) {
    if (!(RoomID in joinReqeustLocal)) {
      joinReqeustLocal[RoomID] = "NEW";
    }
  }
}

// check current path to see if roomid path equals on of key values in storage
const RoomIDpath = location.pathname.split("/").pop();
if (RoomIDpath && RoomIDpath in joinReqeustLocal) {
  joinReqeustLocal[RoomIDpath] = "SEEN";
}

// check if any stored values hav "NEW" value. show notification if does
if (Object.values(joinReqeustLocal).includes("NEW")) {
  notification.classList.remove("hidden");
}

localStorage.setItem("roomJoinRequests", JSON.stringify(joinReqeustLocal));
