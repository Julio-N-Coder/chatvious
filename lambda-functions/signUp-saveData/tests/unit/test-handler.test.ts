import { saveUserData } from "../../handler/saveUserData";
import testPostConfirmationEvent from "../../../events/saveUserDataEvent.json";
import { expect, describe, test } from "@jest/globals";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

describe("Test for saveUserData", () => {
  test("Verifies successful response", async () => {
    const result = await saveUserData(testPostConfirmationEvent);

    expect(result).toEqual(testPostConfirmationEvent);
  });

  test("Verifies Data Is stored in dynamodb", async () => {
    const id = testPostConfirmationEvent.request.userAttributes.sub;

    const command = new GetCommand({
      TableName: "chatvious-users",
      Key: {
        "id-sub": id,
      },
      ConsistentRead: true,
    });

    const response = await docClient.send(command);
    expect(response["$metadata"].httpStatusCode).toBe(200);
    expect(response.Item).not.toBeNull();

    // Cleanup: delete the user after the test
    const deleteCommand = new DeleteCommand({
      TableName: "chatvious-users",
      Key: {
        "id-sub": id,
      },
    });

    await docClient.send(deleteCommand);
  });
});
