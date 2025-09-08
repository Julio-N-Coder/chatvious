import { handler } from "../promoteOrDemoteUser.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterEach,
  beforeEach,
} from "@jest/globals";
import { RoomMemberDB } from "../../../types/types.js";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
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

let userPromotedDemoted = structuredClone(userInfoDB);
let userPromotedDemotedID = "z7574571-6cd1-4fbb-ba4f-43c39573729a";
let userPromotedDemotedName = "userPromotedDemotedName";
userPromotedDemoted.userID = userPromotedDemotedID;
userPromotedDemoted.userName = userPromotedDemotedName;

beforeAll(async () => {
  restAPIEvent.body = JSON.stringify({
    userID: userPromotedDemotedID,
    RoomID,
    action: "PROMOTE",
  });
  restAPIEvent.path = "/rooms/promoteOrDemoteUser";
  restAPIEvent.resource = "/rooms/promoteOrDemoteUser";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

let mockMemberIsMember = true;
beforeEach(async () => {
  ddbMock.on(GetCommand).callsFake((input) => {
    if (input.Key.SortKey === roomMemberDB.SortKey) {
      return Promise.resolve({
        $metadata,
        Item: roomMemberDB,
      });
    }

    return Promise.resolve({
      $metadata,
      Item: {
        ...roomMemberDB,
        userID: userPromotedDemotedID,
        userName: userPromotedDemotedName,
        RoomUserStatus: mockMemberIsMember ? "MEMBER" : "ADMIN",
      } as RoomMemberDB,
    });
  });
  ddbMock.on(UpdateCommand).resolves({
    $metadata,
    Attributes: {},
  });
});

afterEach(async () => {
  ddbMock.reset();
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

// promte then demote in one test
describe("A test to see if the promoteOrDemoteUser works correctly", () => {
  test("promoteOrDemoteUser route successfull promotes a User", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message", "Successfully Promoted User");

    // check whether user promotion was attempted
    expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(1);

    mockMemberIsMember = false;
  });

  test("promoteOrDemoteUser route successfull demotes a User", async () => {
    restAPIEvent.body = JSON.stringify({
      userID: userPromotedDemotedID,
      RoomID,
      action: "DEMOTE",
    });

    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message", "Successfully Demoted User");

    // // check whether user demotion was attempted
    expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(1);
  });

  test("Incorrect Content-Type header should return the correct Error", async () => {
    restAPIEvent.headers["Content-Type"] = "text/html"; // correct header is application/json
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Invalid Content Type");
  });

  test("Body without RoomID, userID and action should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({ random: "someRandomText" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });

  test("Body with RoomID and userID that are not string should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({
      userID: 134134,
      RoomID: 85872,
      action: "PROMOTE",
    });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });

  test("Body with an invalide action should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({
      userID: userPromotedDemotedID,
      RoomID,
      action: "some random action",
    });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });
});
