// This script only runs if they are not a part of the room
import { JoinRoomResponse } from "../types";

const statusContainer = document.getElementById(
  "statusContainer"
) as HTMLDivElement;
const statusTextBox = document.getElementById(
  "statusTextBox"
) as HTMLSpanElement;
const joinRequestButton = document.getElementById(
  "joinRequestButton"
) as HTMLButtonElement;
const joinRoomLoader = document.getElementById(
  "joinRoomLoader"
) as HTMLSpanElement;
const RoomID = location.pathname.split("/")[2];

async function sendJoinRequest() {
  statusTextBox.classList.remove("bg-success", "text-success-content");
  statusTextBox.classList.remove("bg-error", "text-error-content");
  statusContainer.classList.add("hidden");

  function toggleSubmitButtonState() {
    joinRequestButton.disabled = !joinRequestButton.disabled;
    joinRoomLoader.classList.toggle("hidden");
    joinRequestButton.classList.toggle("px-1");
  }
  toggleSubmitButtonState();

  let joinRequestStatus: Response;
  try {
    joinRequestStatus = await fetch("/rooms/joinRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ RoomID }),
    });
  } catch (error) {
    statusTextBox.textContent = "Something went wrong";
    statusTextBox.classList.add("bg-error", "text-error-content");
    statusContainer.classList.remove("hidden");
    toggleSubmitButtonState();
    return;
  }

  const joinRequestResponse: JoinRoomResponse = await joinRequestStatus.json();
  if ("error" in joinRequestResponse) {
    statusTextBox.textContent = joinRequestResponse.error;
    statusTextBox.classList.add("bg-error", "text-error-content");
    statusContainer.classList.remove("hidden");
    toggleSubmitButtonState();
    return;
  }

  statusTextBox.textContent = joinRequestResponse.message;
  statusTextBox.classList.add("bg-success", "text-success-content");
  statusContainer.classList.remove("hidden");
  toggleSubmitButtonState();
}

joinRequestButton.addEventListener("click", sendJoinRequest);
