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

export { newTestUser };
