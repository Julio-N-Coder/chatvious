const promoteButtons = document.getElementsByClassName(
  "promote"
) as HTMLCollectionOf<HTMLButtonElement>;
const fixedStatusBox1 = document.getElementById(
  "fixedStatusBox"
) as HTMLDivElement;

function clearFixedStatusBox1() {
  fixedStatusBox1.classList.remove("bg-success", "text-success-content");
  fixedStatusBox1.classList.remove("bg-error", "text-error-content");
  fixedStatusBox1.innerText = "";
}

for (let i = 0; i < promoteButtons.length; i++) {
  promoteButtons[i].addEventListener("click", async (e: Event) => {
    const promoteButton = e.target as HTMLButtonElement;
    const memberParentElem = promoteButtons[i].parentElement as HTMLDivElement;
    const roomUserStatusElem = memberParentElem.querySelector(
      ".RoomUserStatus"
    ) as HTMLSpanElement;
    const userID = memberParentElem.dataset.userid;
    const RoomID = location.pathname.split("/").pop();

    promoteButton.disabled = true;

    const promoteUserURL = process.env.IS_DEV_SERVER
      ? "/rooms/promoteOrDemoteUser"
      : "/main/rooms/promoteOrDemoteUser";
    let promoteUserResponse: Response;
    try {
      promoteUserResponse = await fetch(promoteUserURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID, RoomID, action: "PROMOTE" }),
      });
    } catch (error) {
      fixedStatusBox1.classList.add("bg-error", "text-error-content");
      fixedStatusBox1.textContent = "Something Went Wrong";

      promoteButton.disabled = false;
      setTimeout(clearFixedStatusBox1, 5000);
      return;
    }

    if (!promoteUserResponse.ok) {
      console.log("Failed to promote user");
      const promoteUserError = await promoteUserResponse.json();
      fixedStatusBox1.classList.add("bg-error", "text-error-content");
      fixedStatusBox1.textContent = promoteUserError.error;
      promoteButton.disabled = false;
      setTimeout(clearFixedStatusBox1, 5000);
      return;
    }

    // update status and show new buttons
    const promoteUserSuccess = await promoteUserResponse.json();
    fixedStatusBox1.classList.add("bg-success", "text-success-content");
    fixedStatusBox1.textContent = promoteUserSuccess.message;
    roomUserStatusElem.innerText = "ADMIN";

    setTimeout(clearFixedStatusBox1, 5000);
  });
}
