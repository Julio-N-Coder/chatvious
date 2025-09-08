import { handler } from "../kickMember.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import { describe, test, expect, beforeAll, afterEach } from "@jest/globals";
import { RoomMemberDB } from "../../../types/types.js";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  userInfoDB,
  roomInfoDB,
  roomMemberDB,
} from "../../../lib/libtest/testData.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

let RoomID = roomInfoDB.RoomID;
const roomName = roomInfoDB.roomName;

let userBeingKicked = structuredClone(userInfoDB);
let userBeingKickedID = "z7574571-6cd1-4fbb-ba4f-43c39573729a";
let userBeingKickedName = "userPromotedDemotedName";
userBeingKicked.userID = userBeingKickedID;
userBeingKicked.userName = userBeingKickedName;

beforeAll(async () => {
  restAPIEvent.body = JSON.stringify({
    userID: userBeingKickedID,
    RoomID,
  });
  restAPIEvent.path = "/rooms/kickMember";
  restAPIEvent.resource = "/rooms/kickMember";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  ddbMock.reset();
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

// make sure to test room user status as well
describe("Test if kickMember route kicks the user from the chat room", () => {
  test("kickMember route returns successfull response and removes member", async () => {
    ddbMock.on(GetCommand).callsFake((input) => {
      if (input.Key.SortKey === roomMemberDB.SortKey) {
        return Promise.resolve({
          $metadata,
          Item: roomMemberDB,
        });

        // fetchRoomsOnUser
      } else if (input.Key.SortKey === "PROFILE") {
        return Promise.resolve({
          $metadata,
          Item: { joinedRooms: [{ RoomID, roomName }], ownedRooms: [] },
        });
      }

      return Promise.resolve({
        $metadata,
        Item: {
          ...roomMemberDB,
          userID: userBeingKickedID,
          userName: userBeingKickedName,
          RoomUserStatus: "MEMBER",
        } as RoomMemberDB,
      });
    });
    ddbMock.on(DeleteCommand).resolves({
      $metadata,
      Attributes: {},
    });
    ddbMock.on(UpdateCommand).resolves({
      $metadata,
      Attributes: {},
    });

    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("User Successfully Kicked");

    // check if member has been attempted to be kicked
    expect(ddbMock.commandCalls(DeleteCommand)).toHaveLength(1);

    // check if room on user is attempted to be removed
    // check if memberCount is attempted to be decreased
    expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(2);
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
