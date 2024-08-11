import { handler } from "../kickMember.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "@jest/globals";
import { userManager } from "../../../models/users.js";
import { roomManager } from "../../../models/rooms.js";
import { UserInfo, RoomInfoType } from "../../../types/types.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.claims.sub;
const userName = restAPIEvent.requestContext.authorizer.claims.username;
const email = restAPIEvent.requestContext.authorizer.claims.email;
let newUser: UserInfo;

const roomName = "kickMemberTestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

let userBeingKicked: UserInfo;
let userBeingKickedID: string;
let userBeingKickedName: string;

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

  // make a user for the person being kicked
  const createuserBeingKickedResponse = await userManager.createUser();
  if ("error" in createuserBeingKickedResponse) {
    throw new Error(
      `Failed to create user. Error: ${createuserBeingKickedResponse.error}`
    );
  }
  userBeingKicked = createuserBeingKickedResponse.newUser;
  userBeingKickedID = userBeingKicked.userID;
  userBeingKickedName = userBeingKicked.userName;

  // make a room for the user to be kicked from
  const createRoomResponse = await roomManager.makeRoom(
    userID,
    userName,
    roomName,
    newUser.profileColor
  );
  if ("error" in createRoomResponse) {
    throw new Error(
      `Failed to create room. Error: ${createRoomResponse.error}`
    );
  }
  roomInfo = createRoomResponse.roomInfo;
  RoomID = roomInfo.RoomID;

  // insert the user being kicked into the room
  const addRoomMemberResponse = await roomManager.addRoomMember(
    RoomID,
    userBeingKickedID,
    userBeingKickedName,
    userBeingKicked.profileColor
  );
  if ("error" in addRoomMemberResponse) {
    throw new Error(
      `Failed to add room member. Error: ${addRoomMemberResponse.error}`
    );
  }

  restAPIEvent.body = JSON.stringify({
    userID: userBeingKickedID,
    RoomID,
  });
  restAPIEvent.path = "/rooms/kickMember";
  restAPIEvent.resource = "/rooms/kickMember";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

// cleanups
afterAll(async () => {
  // delete the users room member entries
  const removeRoomMemberResponse = await roomManager.removeRoomMember(
    RoomID,
    userID
  );
  if ("error" in removeRoomMemberResponse) {
    throw new Error(
      `Failed to clean up RoomMember after test. Error: ${removeRoomMemberResponse.error}`
    );
  }

  const removeMemberUserBeingKickedResponse =
    await roomManager.removeRoomMember(RoomID, userBeingKickedID);
  if ("error" in removeMemberUserBeingKickedResponse) {
    if (removeMemberUserBeingKickedResponse.error != "Bad Request") {
      throw new Error(
        `Something went wrong after cleaning up userBeingKicked from room after test. Error: ${removeMemberUserBeingKickedResponse.error}`
      );
    }
  }

  // delete the users we created
  const deleteUserResponse = await userManager.deleteUser(userID);
  if ("error" in deleteUserResponse) {
    throw new Error(
      `Failed to clean up user after test. Error: ${deleteUserResponse.error}`
    );
  }

  const deleteUserBeingKickedResponse = await userManager.deleteUser(
    userBeingKickedID
  );
  if ("error" in deleteUserBeingKickedResponse) {
    throw new Error(
      `Failed to clean up requesting user after test. Error: ${deleteUserBeingKickedResponse.error}`
    );
  }

  // remove the created room
  const deleteRoomResponse = await roomManager.deleteRoom(RoomID);
  if ("error" in deleteRoomResponse) {
    throw new Error(
      `Failed to clean up Room after test. Error: ${deleteRoomResponse.error}`
    );
  }
});

// make sure to test room user status as well
describe("Test if kickMember route kicks the user from the chat room", () => {
  test("kickMember route returns successfull response with correct input", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("User Successfully Kicked");
  });

  test("Incorrect Content-Type header should return the correct Error", async () => {
    restAPIEvent.headers["Content-Type"] = "text/html"; // correct header is application/json
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Invalid Content Type");
  });

  test("Body without RoomID and userID should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({ random: "someRandomText" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });
});
