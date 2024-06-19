import { create } from "domain";
import "../../css/styles.css";
import {
  themeSwitch,
  isOSDefaultDarkMode,
  preferedTheme,
} from "../navBar/navBar";
import updateTheme from "../navBar/updateTheme";
import { signOut } from "./token-checker";

// const createFormInput = document.getElementById("input-room-name");
// const joinFormInput = document.getElementById("input-room-name");

const createForm = document.getElementById("create-form") as HTMLFormElement;
const joinForm = document.getElementById("join-form") as HTMLFormElement;

// adding Event listeners
themeSwitch.addEventListener("change", () => {
  updateTheme(isOSDefaultDarkMode, themeSwitch, preferedTheme);
});

const signOutButtons = document.getElementsByClassName("sign-out-button");
for (let i = 0; i < signOutButtons.length; i++) {
  signOutButtons[i].addEventListener("click", signOut);
}

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const createSubmitButton = document.getElementById("createSubmitButton");
  const roomName = (
    document.getElementById("input-room-name") as HTMLInputElement
  ).value;
  createSubmitButton?.setAttribute("disabled", "true");

  try {
    const makeRoomResponse = await fetch("/createRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomName }),
    });

    if (makeRoomResponse.ok === true) {
      window.location.href = `/dashboard`;
    }
    // make sure to handle error

    // console.log(await makeRoomResponse.json());
  } catch (error) {
    // display to ui that fetch went wrong
    console.log(error);
  }

  // window.location.href = `/dashboard`;
});

joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const createSubmitButton = document.getElementById("createSubmitButton");
  const roomName = (
    document.getElementById("input-room-name") as HTMLInputElement
  ).value;
  createSubmitButton?.setAttribute("disabled", "true");

  // window.location.href = `/dashboard`;
});
