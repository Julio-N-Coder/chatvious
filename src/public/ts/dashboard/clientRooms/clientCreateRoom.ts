import { MakeRoomResponse } from "../../types";

const createForm = document.getElementById("create-form") as HTMLFormElement;
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
const submitRoomLoader = document.getElementById(
  "createSubmitRoomLoader"
) as HTMLElement;

async function createRoom(e: SubmitEvent) {
  e.preventDefault();
  const roomName = (
    document.getElementById("create-input-room") as HTMLInputElement
  ).value;

  function toggleSubmitButtonState() {
    createSubmitButton.disabled = !createSubmitButton.disabled;
    submitRoomLoader.classList.toggle("hidden");
    createSubmitButton.classList.remove("px-1");
  }
  toggleSubmitButtonState();

  if (!roomName) {
    createmodelError.classList.remove("hidden");
    createmodelError.innerText = "Room Name is required";
    toggleSubmitButtonState();
    return;
  }
  if (roomName.length < 3) {
    createmodelError.classList.remove("hidden");
    createmodelError.innerText = "Room Name must be at least 3 characters";
    toggleSubmitButtonState();
    return;
  }
  if (roomName.length > 25) {
    createmodelError.classList.remove("hidden");
    createmodelError.innerText = "Room Name must be less than 25 characters";
    toggleSubmitButtonState();
    return;
  }

  try {
    const makeRoomResponse = await fetch("rooms/createRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomName }),
    });

    if (makeRoomResponse.ok === true) {
      window.location.href = `/dashboard`;
    }

    const makeRoomResponseJson: MakeRoomResponse =
      await makeRoomResponse.json();

    if ("error" in makeRoomResponseJson) {
      createmodelError.classList.remove("hidden");
      createmodelError.innerText = makeRoomResponseJson.error;
      toggleSubmitButtonState();
    }
  } catch (error) {
    createmodelError.classList.remove("hidden");
    createmodelError.innerText = "Something went wrong while making your room.";

    toggleSubmitButtonState();
  }
}

createForm.addEventListener("submit", createRoom);

createCloseModel.addEventListener("click", () => {
  createSubmitButton.disabled = false;
  submitRoomLoader.classList.add("hidden");
  createSubmitButton.classList.remove("px-1");
  createmodelError.classList.add("hidden");
  createRoomModel.close();
});
