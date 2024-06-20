import "../../css/styles.css";
import {
  themeSwitch,
  isOSDefaultDarkMode,
  preferedTheme,
} from "../navBar/navBar";
import updateTheme from "../navBar/updateTheme";
import { signOut } from "./token-checker";
import { createRoom } from "../rooms";

const createForm = document.getElementById("create-form") as HTMLFormElement;
const joinForm = document.getElementById("join-form") as HTMLFormElement;
const makeRoomModel = document.getElementById(
  "makeRoomModel"
) as HTMLDialogElement;
const joinRoomModel = document.getElementById(
  "joinRoomModel"
) as HTMLDialogElement;
const createCloseModel = document.getElementById(
  "createCloseModel"
) as HTMLButtonElement;
const joinCloseModel = document.getElementById(
  "joinCloseModel"
) as HTMLButtonElement;

// adding Event listeners
themeSwitch.addEventListener("change", () => {
  updateTheme(isOSDefaultDarkMode, themeSwitch, preferedTheme);
});

const signOutButtons = document.getElementsByClassName("sign-out-button");
for (let i = 0; i < signOutButtons.length; i++) {
  signOutButtons[i].addEventListener("click", signOut);
}

createCloseModel.addEventListener("click", () => {
  makeRoomModel.close();
});

joinCloseModel.addEventListener("click", () => {
  joinRoomModel.close();
});

createForm.addEventListener("submit", createRoom);

joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const RoomID = (document.getElementById("input-room-id") as HTMLInputElement)
    .value;
  const joinSubmitButton = document.getElementById(
    "joinSubmitButton"
  ) as HTMLButtonElement;
  const submitRoomLoader = document.getElementById(
    "submitRoomLoader"
  ) as HTMLElement;

  function toggleSubmitButtonState() {
    joinSubmitButton.disabled = !joinSubmitButton.disabled;
    submitRoomLoader.classList.toggle("hidden");
    joinSubmitButton.classList.remove("px-1");
  }
  toggleSubmitButtonState();

  // window.location.href = `/dashboard`;
});
