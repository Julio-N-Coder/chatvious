import { BasicServerResponse } from "../../types";

const joinForm = document.getElementById("join-form") as HTMLFormElement;
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
  "joinSubmitRoomLoader"
) as HTMLElement;

async function joinRoom(e: SubmitEvent) {
  e.preventDefault();
  const RoomID = (
    document.getElementById("join-room-input") as HTMLInputElement
  ).value;

  function toggleSubmitButtonState() {
    joinSubmitButton.disabled = !joinSubmitButton.disabled;
    submitRoomLoader.classList.toggle("hidden");
    joinSubmitButton.classList.remove("px-1");
  }
  toggleSubmitButtonState();

  if (!RoomID) {
    joinmodelError.classList.remove("hidden");
    joinmodelError.innerText = "Room ID is required";
    toggleSubmitButtonState();
    return;
  }
  if (RoomID.length < 20) {
    joinmodelError.classList.remove("hidden");
    joinmodelError.innerText = "Room ID must be at least 20 characters";
    toggleSubmitButtonState();
    return;
  }
  if (RoomID.length > 50) {
    joinmodelError.classList.remove("hidden");
    joinmodelError.innerText = "Room ID must be less than 50 characters";
    toggleSubmitButtonState();
    return;
  }

  try {
    const joinRoomResponse = await fetch("rooms/joinRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ RoomID }),
    });

    if (joinRoomResponse.ok === true) {
      window.location.href = `/dashboard`;
      return;
    }
    const joinRoomResponseJson: BasicServerResponse =
      await joinRoomResponse.json();

    if ("error" in joinRoomResponseJson) {
      joinmodelError.classList.remove("hidden");
      joinmodelError.innerText = joinRoomResponseJson.error;
      toggleSubmitButtonState();
    }
  } catch (error) {
    joinmodelError.classList.remove("hidden");
    joinmodelError.innerText = "Something went wrong while making your room.";

    toggleSubmitButtonState();
    return;
  }
}

joinForm.addEventListener("submit", joinRoom);

joinCloseModel.addEventListener("click", () => {
  joinSubmitButton.disabled = false;
  submitRoomLoader.classList.add("hidden");
  joinSubmitButton.classList.remove("px-1");
  joinmodelError.classList.add("hidden");
  joinRoomModel.close();
});
