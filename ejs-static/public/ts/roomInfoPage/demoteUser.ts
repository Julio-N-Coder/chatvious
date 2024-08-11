const demoteButtons = document.getElementsByClassName(
  "demote"
) as HTMLCollectionOf<HTMLButtonElement>;
const fixedStatusBox2 = document.getElementById(
  "fixedStatusBox"
) as HTMLDivElement;

function clearFixedStatusBox2() {
  fixedStatusBox2.classList.remove("bg-success", "text-success-content");
  fixedStatusBox2.classList.remove("bg-error", "text-error-content");
  fixedStatusBox2.innerText = "";
}

for (let i = 0; i < demoteButtons.length; i++) {
  demoteButtons[i].addEventListener("click", async (e: Event) => {
    const demoteButton = e.target as HTMLButtonElement;
    const memberParentElem = demoteButtons[i].parentElement as HTMLDivElement;
    const roomUserStatusElem = memberParentElem.querySelector(
      ".RoomUserStatus"
    ) as HTMLSpanElement;
    const userID = memberParentElem.dataset.userid;
    const RoomID = location.pathname.split("/").pop();

    demoteButton.disabled = true;

    const demoteUserURL = process.env.IS_DEV_SERVER
      ? "/rooms/promoteOrDemoteUser"
      : "/main/rooms/promoteOrDemoteUser";
    let demoteUserResponse: Response;
    try {
      demoteUserResponse = await fetch(demoteUserURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID, RoomID, action: "DEMOTE" }),
      });
    } catch (error) {
      fixedStatusBox2.classList.add("bg-error", "text-error-content");
      fixedStatusBox2.textContent = "Something Went Wrong";

      demoteButton.disabled = false;
      setTimeout(clearFixedStatusBox2, 5000);
      return;
    }

    if (!demoteUserResponse.ok) {
      console.log("Failed to demote user");
      const promoteUserError = await demoteUserResponse.json();
      fixedStatusBox2.classList.add("bg-error", "text-error-content");
      fixedStatusBox2.textContent = promoteUserError.error;
      demoteButton.disabled = false;
      setTimeout(clearFixedStatusBox2, 5000);
      return;
    }

    // update status and show new buttons
    const promoteUserSuccess = await demoteUserResponse.json();
    fixedStatusBox2.classList.add("bg-success", "text-success-content");
    fixedStatusBox2.textContent = promoteUserSuccess.message;
    roomUserStatusElem.innerText = "MEMBER";

    setTimeout(clearFixedStatusBox2, 5000);
  });
}
