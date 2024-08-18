import { PostConfirmationEvent } from "../../types/types.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const colors = ["blue", "green", "orange", "yellow", "sky", "purple", "pink"];
const getRandomColor = () => {
  return colors[Math.floor(Math.random() * colors.length)];
};

export const handler = async (event: PostConfirmationEvent) => {
  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    const tableName = process.env.CHATVIOUSTABLE_TABLE_NAME;
    const dynamodbOptionsString = process.env.DYNAMODB_OPTIONS || "{}";
    const dynamodbOptions = JSON.parse(dynamodbOptionsString);
    const client = new DynamoDBClient(dynamodbOptions);
    const docClient = DynamoDBDocumentClient.from(client);
    const userID = event.request.userAttributes.sub;

    const userDataCommand = new PutCommand({
      TableName: tableName,
      Item: {
        PartitionKey: `USER#${userID}`,
        SortKey: "PROFILE",
        userID,
        userName: event.userName,
        email: event.request.userAttributes.email,
        ownedRooms: [],
        joinedRooms: [],
        profileColor: getRandomColor(),
      },
    });

    const res = await docClient.send(userDataCommand);
    if (res.$metadata.httpStatusCode !== 200) {
      throw new Error("Failed to save user data");
    }

    return event;
  }

  return event;
};
