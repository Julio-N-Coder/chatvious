import { expect } from "@jest/globals";
import { userManager } from "../../models/users.js";

// check if there is a user, delete them to have the same info if they exist
async function newTestUser(userID: string, userName: string) {
  const fetchUserInfoResponse = await userManager.fetchUserInfo(userID);
  let userExists = true;
  if ("error" in fetchUserInfoResponse) {
    if (fetchUserInfoResponse.error === "Failed to Get User Info") {
      throw new Error("Failed to fetch user info");
    }
    userExists = false;
  } else {
    userExists = true;
  }
  if (userExists) {
    const deleteUserResponse = await userManager.deleteUser(userID);
    if ("error" in deleteUserResponse) {
      throw new Error(
        `Failed to clean up before test. Error: ${deleteUserResponse.error}`
      );
    }
  }

  const createUserResponse = await userManager.createUser(userID, userName);
  if ("error" in createUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createUserResponse.error}`
    );
  }

  return createUserResponse.newUser;
}

async function checkRoomsOnUser(
  userID: string,
  RoomID: string,
  roomName: string,
  ownedJoinedOrRemoved: "Owned" | "Joined" | "Removed" = "Joined"
) {
  const roomOnUserResponse = await userManager.fetchSingleRoomOnUser(
    userID,
    RoomID
  );
  if (ownedJoinedOrRemoved !== "Removed") {
    if ("error" in roomOnUserResponse) {
      throw new Error(
        `Failed to fetch rooms on user. Error: ${roomOnUserResponse.error}`
      );
    }

    expect(roomOnUserResponse).toHaveProperty("statusCode", 200);
    expect(roomOnUserResponse).toHaveProperty(
      "message",
      `${ownedJoinedOrRemoved} Room Found`
    );
    expect(roomOnUserResponse).toHaveProperty("data");
    expect(roomOnUserResponse.data).toHaveProperty("roomName", roomName);
    expect(roomOnUserResponse.data).toHaveProperty("RoomID", RoomID);
    return roomOnUserResponse;
  } else {
    const roomOnUserResponse = await userManager.fetchSingleRoomOnUser(
      userID,
      RoomID
    );
    if (
      "error" in roomOnUserResponse &&
      roomOnUserResponse.error !== "Room on user not found"
    ) {
      throw new Error(
        `Failed to fetch rooms on user. Error: ${roomOnUserResponse.error}`
      );
    }

    expect(roomOnUserResponse).toHaveProperty("statusCode", 404);
    expect(roomOnUserResponse).toHaveProperty(
      "error",
      "Room on user not found"
    );
    return roomOnUserResponse;
  }
}

export { newTestUser, checkRoomsOnUser };
