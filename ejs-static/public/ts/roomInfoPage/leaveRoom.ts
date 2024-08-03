const leaveRoomButton = document.getElementById(
  "leaveRoom"
) as HTMLButtonElement;
const leaveRoomLoader = document.getElementById(
  "leaveRoomLoader"
) as HTMLSpanElement;
const fixedStatusBox = document.getElementById(
  "fixedStatusBox"
) as HTMLDivElement;
const RoomID = location.pathname.split("/").pop() as string;

leaveRoomButton.addEventListener("click", async () => {
  function toggleSubmitButtonState() {
    leaveRoomButton.disabled = !leaveRoomButton.disabled;
    leaveRoomLoader.classList.toggle("hidden");
    leaveRoomButton.classList.toggle("px-1");
  }
  toggleSubmitButtonState();

  let deleteRoomStatus: Response;
  try {
    deleteRoomStatus = await fetch("/rooms/deleteRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ RoomID }),
    });
  } catch (error) {
    fixedStatusBox.textContent = "Something went wrong";
    fixedStatusBox.classList.add("bg-error", "text-error-content");
    toggleSubmitButtonState();
    return;
  }

  if (!deleteRoomStatus.ok) {
    let deleteRoomError;
    try {
      deleteRoomError = await deleteRoomStatus.json();
    } catch (error) {
      fixedStatusBox.textContent = "Something went wrong";
      fixedStatusBox.classList.add("bg-error", "text-error-content");
      toggleSubmitButtonState();

      setTimeout(() => {
        fixedStatusBox.classList.remove(
          "bg-success",
          "text-success-content",
          "bg-error",
          "text-error-content"
        );
        fixedStatusBox.innerText = "";
      }, 5000);
      return;
    }

    fixedStatusBox.textContent =
      deleteRoomError.error || "Something went wrong";
    fixedStatusBox.classList.add("bg-error", "text-error-content");
    toggleSubmitButtonState();

    setTimeout(() => {
      fixedStatusBox.classList.remove(
        "bg-success",
        "text-success-content",
        "bg-error",
        "text-error-content"
      );
      fixedStatusBox.innerText = "";
    }, 5000);
    return;
  }

  window.location.href = "/dashboard";
});
