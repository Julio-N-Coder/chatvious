import { handler } from "../dashboard";
import restAPIEvent from "../../../../events/restAPIEvent.json";
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { userManager } from "../../../models/users.js";
import ejs from "ejs";
import { UserInfo } from "../../../types/types.js";
import { newTestUser } from "../../../lib/libtest/handyTestUtils.js";

const userID = restAPIEvent.requestContext.authorizer.claims.sub;
const userName = restAPIEvent.requestContext.authorizer.claims.username;
const email = restAPIEvent.requestContext.authorizer.claims.email;
let newUser: UserInfo;

beforeAll(async () => {
  newUser = await newTestUser(userID, userName);
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
