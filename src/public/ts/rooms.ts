import { makeRoomResponse } from "./types";

// pass event type to createRoom parameter
async function createRoom(e: Event) {
  e.preventDefault();
  const roomName = (
    document.getElementById("input-room-name") as HTMLInputElement
  ).value;
  const createSubmitButton = document.getElementById(
    "createSubmitButton"
  ) as HTMLButtonElement;
  const submitRoomLoader = document.getElementById(
    "submitRoomLoader"
  ) as HTMLElement;
  const modalError = document.getElementById("modelError") as HTMLElement;

  function toggleSubmitButtonState() {
    createSubmitButton.disabled = !createSubmitButton.disabled;
    submitRoomLoader.classList.toggle("hidden");
    createSubmitButton.classList.remove("px-1");
  }
  toggleSubmitButtonState();

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

    const makeRoomResponseJson: makeRoomResponse =
      await makeRoomResponse.json();

    if ("error" in makeRoomResponseJson) {
      modalError.classList.remove("hidden");
      modalError.innerText = makeRoomResponseJson.error;
      toggleSubmitButtonState();
    }
  } catch (error) {
    modalError.classList.remove("hidden");
    modalError.innerText = "Something went wrong while making your room.";

    toggleSubmitButtonState();
  }
}

export { createRoom };
