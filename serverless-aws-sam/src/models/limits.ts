import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

const tableName = process.env.CHATVIOUSTABLE_TABLE_NAME
  ? process.env.CHATVIOUSTABLE_TABLE_NAME
  : "chatvious";
const dynamodbOptionsString = process.env.DYNAMODB_OPTIONS || "{}";
const dynamodbOptions = JSON.parse(dynamodbOptionsString);
const client = new DynamoDBClient(dynamodbOptions);
const docClient = DynamoDBDocumentClient.from(client);

type BasicResponse =
  | { message: string; statusCode: number }
  | {
      statusCode: number;
      error: string;
    };

/**
 * Attempts to increment the totalRooms counter with a limit check
 * @param limit - Maximum number of rooms allowed
 * @returns Promise<BasicResponse> - message if increment succeeded, error if limit reached
 */
export async function incrementRoomsCount(
  limit: number
): Promise<BasicResponse> {
  const updateParams: UpdateCommandInput = {
    TableName: tableName,
    Key: {
      PartitionKey: "LIMITS",
      SortKey: "LIMITS",
    },
    UpdateExpression: "ADD totalRooms :inc",
    ConditionExpression: "totalRooms < :limit",
    ExpressionAttributeValues: {
      ":inc": 1,
      ":limit": limit,
    },
  };

  try {
    await docClient.send(new UpdateCommand(updateParams));
    return { message: "Incremented", statusCode: 200 };
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      console.log("room limit error: ", error);
      return { error: "Room limit reached", statusCode: 429 };
    }

    return { error: "Database error", statusCode: 500 };
  }
}

/**
 * Decrements the totalRooms counter
 * @returns Promise<BasicResponse> - message if increment succeeded, error if limit reached
 */
export async function decrementRoomsCount(): Promise<BasicResponse> {
  const updateParams: UpdateCommandInput = {
    TableName: tableName,
    Key: {
      PartitionKey: "LIMITS",
      SortKey: "LIMITS",
    },
    UpdateExpression: "ADD totalRooms :dec",
    ConditionExpression: "totalRooms > :zero",
    ExpressionAttributeValues: {
      ":dec": -1,
      ":zero": 0,
    },
  };

  try {
    await docClient.send(new UpdateCommand(updateParams));
    return { message: "Incremented", statusCode: 200 };
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      // Count is already at 0, which is fine for rollback
      return { message: "Incremented", statusCode: 200 };
    }
    return { error: "Database error", statusCode: 500 };
  }
}
