import { makeRoomResponse } from "./types";

async function createRoom(
  e: SubmitEvent,
  createSubmitButton: HTMLButtonElement,
  submitRoomLoader: HTMLElement,
  createmodelError: HTMLElement
) {
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

    const makeRoomResponseJson: makeRoomResponse =
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

async function joinRoom(
  e: SubmitEvent,
  joinSubmitButton: HTMLButtonElement,
  submitRoomLoader: HTMLElement,
  joinmodelError: HTMLElement
) {
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

  const joinRoomResponse = await fetch("rooms/joinRoom", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ RoomID }),
  });

  if (joinRoomResponse.ok === true) {
    toggleSubmitButtonState();
    console.log(await joinRoomResponse.json());
    // window.location.href = `/dashboard`;
  }

  // window.location.href = `/dashboard`;
}

export { createRoom, joinRoom };
