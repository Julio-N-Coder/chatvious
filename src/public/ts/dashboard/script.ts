import "../../css/styles.css";
import {
  themeSwitch,
  isOSDefaultDarkMode,
  preferedTheme,
} from "../navBar/navBar";
import updateTheme from "../navBar/updateTheme";
import { signOut } from "./token-checker";
import { createRoom, joinRoom } from "../rooms";

const createForm = document.getElementById("create-form") as HTMLFormElement;
const joinForm = document.getElementById("join-form") as HTMLFormElement;

// createRoom Declarations
const createRoomModel = document.getElementById(
  "createRoomModel"
) as HTMLDialogElement;
const createCloseModel = document.getElementById(
  "createCloseModel"
) as HTMLButtonElement;
const createmodelError = document.getElementById(
  "createmodelError"
) as HTMLElement;
const createSubmitButton = document.getElementById(
  "createSubmitButton"
) as HTMLButtonElement;

// joinRoom Declarations
const joinRoomModel = document.getElementById(
  "joinRoomModel"
) as HTMLDialogElement;
const joinCloseModel = document.getElementById(
  "joinCloseModel"
) as HTMLButtonElement;
const joinmodelError = document.getElementById("joinmodelError") as HTMLElement;
const joinSubmitButton = document.getElementById(
  "joinSubmitButton"
) as HTMLButtonElement;

const submitRoomLoader = document.getElementById(
  "submitRoomLoader"
) as HTMLElement;

// adding Event listeners
themeSwitch.addEventListener("change", () => {
  updateTheme(isOSDefaultDarkMode, themeSwitch, preferedTheme);
});

const signOutButtons = document.getElementsByClassName("sign-out-button");
for (let i = 0; i < signOutButtons.length; i++) {
  signOutButtons[i].addEventListener("click", signOut);
}

// cleanup modals after closing
createCloseModel.addEventListener("click", () => {
  createSubmitButton.disabled = false;
  submitRoomLoader.classList.add("hidden");
  createSubmitButton.classList.remove("px-1");
  createmodelError.classList.add("hidden");
  createRoomModel.close();
});

joinCloseModel.addEventListener("click", () => {
  joinSubmitButton.disabled = false;
  submitRoomLoader.classList.add("hidden");
  joinSubmitButton.classList.remove("px-1");
  joinmodelError.classList.add("hidden");
  joinRoomModel.close();
});

createForm.addEventListener("submit", async (e) => {
  await createRoom(e, createSubmitButton, submitRoomLoader, createmodelError);
});

joinForm.addEventListener("submit", async (e) => {
  await joinRoom(e, joinSubmitButton, submitRoomLoader, joinmodelError);
});
