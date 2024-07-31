import { handler } from "../dashboard";
import restAPIEvent from "../../../../events/restAPIEvent.json";
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { userManager } from "../../../models/users.js";
import ejs from "ejs";
import { UserInfo } from "../../../types/types.js";

const userID = restAPIEvent.requestContext.authorizer.claims.sub;
const userName = restAPIEvent.requestContext.authorizer.claims.username;
const email = restAPIEvent.requestContext.authorizer.claims.email;
let newUser: UserInfo;

beforeAll(async () => {
  // check if there is a user, delete them to have the same info if they exist
  const fetchUserInfoResponse = await userManager.fetchUserInfo(userID);
  if ("error" in fetchUserInfoResponse) {
    if (fetchUserInfoResponse.error === "Failed to Get User Info") {
      throw new Error("Failed to fetch user info");
    }
  } else {
    const deleteUserResponse = await userManager.deleteUser(userID);
    if ("error" in deleteUserResponse) {
      throw new Error(
        `Failed to clean up before test. Error: ${deleteUserResponse.error}`
      );
    }
  }

  const createUserResponse = await userManager.createUser(
    userID,
    userName,
    email
  );
  if ("error" in createUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createUserResponse.error}`
    );
  }
  newUser = createUserResponse.newUser;
});

// cleanups
afterAll(async () => {
  // delete the user we created
  const deleteUserResponse = await userManager.deleteUser(userID);
  if ("error" in deleteUserResponse) {
    throw new Error(
      `Failed to clean up after test. Error: ${deleteUserResponse.error}`
    );
  }
});

describe("Test for rendering the dashboard page", () => {
  test("Testing if dashboard page returns and renders correctly", async () => {
    const dashboardResponse = await handler(restAPIEvent);
    expect(dashboardResponse.statusCode).toBe(200);
    expect(dashboardResponse.headers).toMatchObject({
      "Content-Type": "text/html",
    });

    // render ejs and compare (have to specify path relative to root rather than this file for some reason)
    const dashboardHtml = await ejs.renderFile("../../views/dashboard.ejs", {
      ownedRooms: newUser.ownedRooms,
      joinedRooms: newUser.joinedRooms,
      username: newUser.userName,
      profileColor: newUser.profileColor,
      navJoinRequest: [],
      isProduction: false,
    });
    expect(dashboardResponse.body).toBe(dashboardHtml);
  });
});
