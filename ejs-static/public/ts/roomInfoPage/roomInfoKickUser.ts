import { BasicServerSuccess, BasicServerError } from "../types";

const kickButtons = document.getElementsByClassName(
  "kick"
) as HTMLCollectionOf<HTMLButtonElement>;
const fixedStatusBox = document.getElementById(
  "fixedStatusBox"
) as HTMLDivElement;

function clearFixedStatusBox() {
  fixedStatusBox.classList.remove("bg-success", "text-success-content");
  fixedStatusBox.classList.remove("bg-error", "text-error-content");
  fixedStatusBox.innerText = "";
}

for (let i = 0; i < kickButtons.length; i++) {
  kickButtons[i].addEventListener("click", async (e: Event) => {
    const kickButton = e.target as HTMLButtonElement;
    const memberParentElem = kickButtons[i].parentElement as HTMLDivElement;
    const userID = memberParentElem.dataset.userid;
    const RoomID = location.pathname.split("/").pop();

    kickButton.disabled = true;

    const kickMemberURL = process.env.IS_DEV_SERVER
      ? "/rooms/kickMember"
      : "/main/rooms/kickMember";
    let kickMemberResponse: Response;
    try {
      kickMemberResponse = await fetch(kickMemberURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID, RoomID }),
      });
    } catch (error) {
      fixedStatusBox.classList.add("bg-error", "text-error-content");
      fixedStatusBox.textContent = "Something Went Wrong";

      kickButton.disabled = false;
      setTimeout(clearFixedStatusBox, 5000);
      return;
    }

    if (!kickMemberResponse.ok) {
      console.log("Failed to kick member");
      const kickMemberError: BasicServerError = await kickMemberResponse.json();
      fixedStatusBox.classList.add("bg-error", "text-error-content");
      fixedStatusBox.textContent = kickMemberError.error;
      kickButton.disabled = false;
      setTimeout(clearFixedStatusBox, 5000);
      return;
    }

    memberParentElem.remove();
    const kickMemberSuccess: BasicServerSuccess =
      await kickMemberResponse.json();
    fixedStatusBox.classList.add("bg-success", "text-success-content");
    fixedStatusBox.textContent = kickMemberSuccess.message;

    setTimeout(clearFixedStatusBox, 5000);
  });
}
