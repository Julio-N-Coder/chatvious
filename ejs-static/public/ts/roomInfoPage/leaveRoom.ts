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

  const leaveRoomURL = "/rooms/leaveRoom";
  let leaveRoomStatus: Response;
  try {
    leaveRoomStatus = await fetch(leaveRoomURL, {
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

  if (!leaveRoomStatus.ok) {
    let leaveRoomError;
    try {
      leaveRoomError = await leaveRoomStatus.json();
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

    fixedStatusBox.textContent = leaveRoomError.error || "Something went wrong";
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

  const dashboardURL = "/dashboard";
  window.location.href = dashboardURL;
});
