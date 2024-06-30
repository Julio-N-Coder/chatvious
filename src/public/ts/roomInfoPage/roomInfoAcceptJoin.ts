import { BasicServerError, BasicServerSuccess } from "../types";

const acceptJoinRequest = document.getElementsByClassName("acceptJoinRequest");
const rejectJoinRequest = document.getElementsByClassName("rejectJoinRequest");
const fixedStatusBox = document.getElementById(
  "fixedStatusBox"
) as HTMLDivElement;

const RoomID = location.pathname.split("/")[2];

for (let i = 0; i < acceptJoinRequest.length; i++) {
  acceptJoinRequest[i].addEventListener("click", async (e: Event) => {
    const button = e.target as HTMLButtonElement;
    // get date data and userID from parent
    const mainParentContainer = (e.target as HTMLElement).parentElement
      ?.parentElement?.parentElement as HTMLDivElement;
    const sentJoinRequestAt = mainParentContainer?.dataset?.date;
    const userID = mainParentContainer?.dataset?.userid;

    button.disabled = true;

    let acceptJoinRequestResponse: Response;
    try {
      acceptJoinRequestResponse = await fetch("/rooms/acceptJoinRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentJoinRequestAt, RoomID, userID }),
      });
    } catch (error) {
      fixedStatusBox.classList.add("bg-error", "text-error-content");
      fixedStatusBox.innerText = "Something Went Wrong";
      button.disabled = false;
      return;
    }

    if (!acceptJoinRequestResponse.ok) {
      const errorResponse: BasicServerError =
        await acceptJoinRequestResponse.json();

      fixedStatusBox.classList.add("bg-error", "text-error-content");
      fixedStatusBox.innerText = errorResponse.error;
      button.disabled = false;
      return;
    }

    // display status and if successful,
    const joinRequestAccepted: BasicServerSuccess =
      await acceptJoinRequestResponse.json();
    fixedStatusBox.classList.add("bg-success", "text-success-content");
    fixedStatusBox.innerText = joinRequestAccepted.message;
    button.disabled = false;

    mainParentContainer.remove();

    setTimeout(() => {
      fixedStatusBox.classList.remove(
        "bg-success",
        "text-success-content",
        "bg-error",
        "text-error-content"
      );
      fixedStatusBox.innerText = "";
    }, 5000);
  });
}

for (let i = 0; i < rejectJoinRequest.length; i++) {
  rejectJoinRequest[i].addEventListener("click", async (e: Event) => {
    const button = e.target as HTMLButtonElement;
    // get date data from parent
    const mainParentContainer = (e.target as HTMLElement).parentElement
      ?.parentElement?.parentElement as HTMLDivElement;
    const sentJoinRequestAt = mainParentContainer?.dataset?.date;
    const userID = mainParentContainer?.dataset?.userid;

    button.disabled = true;

    let acceptJoinRequestResponse: Response;
    try {
      acceptJoinRequestResponse = await fetch("/rooms/rejectJoinRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentJoinRequestAt, RoomID, userID }),
      });
    } catch (error) {
      fixedStatusBox.classList.add("bg-error", "text-error-content");
      fixedStatusBox.innerText = "Something Went Wrong";
      button.disabled = false;
      return;
    }

    if (!acceptJoinRequestResponse.ok) {
      const errorResponse: BasicServerError =
        await acceptJoinRequestResponse.json();

      fixedStatusBox.classList.add("bg-error", "text-error-content");
      fixedStatusBox.innerText = errorResponse.error;
      button.disabled = false;
      return;
    }

    // display status and if successful,
    const joinRequestAccepted: BasicServerSuccess =
      await acceptJoinRequestResponse.json();
    fixedStatusBox.classList.add("bg-success", "text-success-content");
    fixedStatusBox.innerText = joinRequestAccepted.message;
    button.disabled = false;

    mainParentContainer.remove();

    setTimeout(() => {
      fixedStatusBox.classList.remove(
        "bg-success",
        "text-success-content",
        "bg-error",
        "text-error-content"
      );
      fixedStatusBox.innerText = "";
    }, 5000);
  });
}
