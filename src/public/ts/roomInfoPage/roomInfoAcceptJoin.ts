const acceptJoinRequest = document.getElementsByClassName("acceptJoinRequest");
const rejectJoinRequest = document.getElementsByClassName("rejectJoinRequest");

const RoomID = location.pathname.split("/")[2];

for (let i = 0; i < acceptJoinRequest.length; i++) {
  acceptJoinRequest[i].addEventListener("click", async (e: Event) => {
    // get date data and userID from parent
    const mainParentContainer = (e.target as HTMLElement).parentElement
      ?.parentElement?.parentElement;
    const sentJoinRequestAt = mainParentContainer?.dataset?.date;
    const userID = mainParentContainer?.dataset?.userid;

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
      console.log(error);
      return;
    }

    if (!acceptJoinRequestResponse.ok) {
      // error handling not set up yet.
      console.log("Failed to accept join request");
      return;
    }

    // display status and if successful,
    console.log("Join request accepted");
    console.log(acceptJoinRequestResponse);
  });
}

for (let i = 0; i < rejectJoinRequest.length; i++) {
  rejectJoinRequest[i].addEventListener("click", async (e: Event) => {
    // get date data from parent
    const mainParentContainer = (e.target as HTMLElement).parentElement
      ?.parentElement?.parentElement;
    const sentJoinRequestAt = mainParentContainer?.dataset?.date;
    const userID = mainParentContainer?.dataset?.userid;

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
      console.log(error);
      return;
    }

    if (!acceptJoinRequestResponse.ok) {
      // error handling not set up yet.
      console.log("Failed to reject join request");
      console.log(await acceptJoinRequestResponse.json());
      return;
    }

    console.log("Join request rejected");
    console.log(await acceptJoinRequestResponse.json());
  });
}
