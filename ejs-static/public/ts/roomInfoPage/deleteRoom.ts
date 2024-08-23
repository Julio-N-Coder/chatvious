const deleteRoomButton = document.querySelector(
  "#deleteRoom"
) as HTMLButtonElement;
const deleteRoomLoader = document.querySelector(
  "#deleteRoomLoader"
) as HTMLSpanElement;
const fixedMainStatusBox = document.getElementById(
  "fixedStatusBox"
) as HTMLDivElement;
const roomID = location.pathname.split("/").pop() as string;

deleteRoomButton.addEventListener("click", async () => {
  function toggleSubmitButtonState() {
    deleteRoomButton.disabled = !deleteRoomButton.disabled;
    deleteRoomLoader.classList.toggle("hidden");
    deleteRoomButton.classList.toggle("px-1");
  }
  toggleSubmitButtonState();

  const deleteRoomURL = "/rooms/deleteRoom";
  let deleteRoomStatus: Response;
  try {
    deleteRoomStatus = await fetch(deleteRoomURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ RoomID: roomID }),
    });
  } catch (error) {
    fixedMainStatusBox.textContent = "Something went wrong";
    fixedMainStatusBox.classList.add("bg-error", "text-error-content");
    toggleSubmitButtonState();
    console.error("failed to deleteRoom");
    return;
  }

  if (!deleteRoomStatus.ok) {
    console.log("after error catch");
    let deleteRoomError;
    try {
      deleteRoomError = await deleteRoomStatus.json();
    } catch (error) {
      fixedMainStatusBox.textContent = "Something went wrong";
      fixedMainStatusBox.classList.add("bg-error", "text-error-content");
      toggleSubmitButtonState();

      setTimeout(() => {
        fixedMainStatusBox.classList.remove(
          "bg-success",
          "text-success-content",
          "bg-error",
          "text-error-content"
        );
        fixedMainStatusBox.innerText = "";
      }, 5000);
      return;
    }

    fixedMainStatusBox.textContent =
      deleteRoomError.error || "Something went wrong";
    fixedMainStatusBox.classList.add("bg-error", "text-error-content");
    toggleSubmitButtonState();

    setTimeout(() => {
      fixedMainStatusBox.classList.remove(
        "bg-success",
        "text-success-content",
        "bg-error",
        "text-error-content"
      );
      fixedMainStatusBox.innerText = "";
    }, 5000);
    return;
  }

  const dashboardURL = "/dashboard";
  window.location.href = dashboardURL;
});
