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
  "submitRoomLoader"
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

joinForm.addEventListener("submit", joinRoom);

joinCloseModel.addEventListener("click", () => {
  joinSubmitButton.disabled = false;
  submitRoomLoader.classList.add("hidden");
  joinSubmitButton.classList.remove("px-1");
  joinmodelError.classList.add("hidden");
  joinRoomModel.close();
});
