import { BasicServerResponse, BasicServerError } from "../types";

const promoteDemoteButtons = document.getElementsByClassName(
  "promoteDemote"
) as HTMLCollectionOf<HTMLButtonElement>;
const fixedStatusBox1 = document.getElementById(
  "fixedStatusBox"
) as HTMLDivElement;

function clearFixedStatusBox1() {
  fixedStatusBox1.classList.remove("bg-success", "text-success-content");
  fixedStatusBox1.classList.remove("bg-error", "text-error-content");
  fixedStatusBox1.innerText = "";
}

for (let i = 0; i < promoteDemoteButtons.length; i++) {
  promoteDemoteButtons[i].addEventListener("click", async (e: Event) => {
    const promoteDemoteButton = e.target as HTMLButtonElement;
    const action = promoteDemoteButton.classList.contains("promote")
      ? "PROMOTE"
      : "DEMOTE";
    const memberParentElem = promoteDemoteButtons[i]
      .parentElement as HTMLDivElement;
    const roomUserStatusElem = memberParentElem.querySelector(
      ".RoomUserStatus"
    ) as HTMLSpanElement;
    const userID = memberParentElem.dataset.userid;
    const RoomID = location.pathname.split("/").pop();

    promoteDemoteButton.disabled = true;

    const promoteDemoteUserURL = process.env.IS_DEV_SERVER
      ? "/rooms/promoteOrDemoteUser"
      : "/main/rooms/promoteOrDemoteUser";
    let promoteDemoteUserResponse: Response;
    try {
      promoteDemoteUserResponse = await fetch(promoteDemoteUserURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID, RoomID, action }),
      });
    } catch (error) {
      fixedStatusBox1.classList.add("bg-error", "text-error-content");
      fixedStatusBox1.textContent = "Something Went Wrong";

      promoteDemoteButton.disabled = false;
      setTimeout(clearFixedStatusBox1, 5000);
      return;
    }

    if (!promoteDemoteUserResponse.ok) {
      console.log("Failed to promote user");
      const promoteDemoteError: BasicServerError =
        await promoteDemoteUserResponse.json();
      fixedStatusBox1.classList.add("bg-error", "text-error-content");
      fixedStatusBox1.textContent = promoteDemoteError.error;
      promoteDemoteButton.disabled = false;
      setTimeout(clearFixedStatusBox1, 5000);
      return;
    }

    const promoteDemoteSuccess: BasicServerResponse =
      await promoteDemoteUserResponse.json();
    if ("error" in promoteDemoteSuccess) {
      fixedStatusBox1.classList.add("bg-error", "text-error-content");
      fixedStatusBox1.textContent = promoteDemoteSuccess.error;
      promoteDemoteButton.disabled = false;
      setTimeout(clearFixedStatusBox1, 5000);
      return;
    }

    // update status and remove button
    promoteDemoteButton.remove();
    fixedStatusBox1.classList.add("bg-success", "text-success-content");
    fixedStatusBox1.textContent = promoteDemoteSuccess.message;
    roomUserStatusElem.innerText = action === "PROMOTE" ? "ADMIN" : "MEMBER";

    setTimeout(clearFixedStatusBox1, 5000);
  });
}
