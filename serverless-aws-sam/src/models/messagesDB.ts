import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommandOutput,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { BaseModels } from "./baseModels.js";
import {
  Message,
  MessageDB,
  BaseModelsReturnType,
  FetchAllMessagesReturn,
} from "../types/types.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

class MessagesManagerDB extends BaseModels {
  constructor(tableName: string, pk: string, sk: string) {
    super(tableName, pk, sk);
  }

  async storeMessage(
    userID: string,
    RoomID: string,
    message: string,
    messageIdArg?: string
  ): BaseModelsReturnType {
    const currentTimestamp = new Date().toISOString();
    const messageId = messageIdArg ? messageIdArg : crypto.randomUUID();

    const messageData: MessageDB = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `MESSAGES#DATE#${currentTimestamp}#MESSAGEID#${messageId}`,
      message,
      messageId,
      userID,
      RoomID,
    };

    let saveMessageResponse: PutCommandOutput;
    try {
      saveMessageResponse = await this.writeItem(messageData);
    } catch (error) {
      return {
        statusCode: 500,
        message: "Server Error storing message",
      };
    }

    const statusCode = saveMessageResponse.$metadata.httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Something Went wrong while storing data", statusCode };
    }

    return {
      message: "Message stored successfully",
      statusCode: 200,
    };
  }

  async fetchMessage(RoomID: string, messageDate: string, messageId: string) {}

  async fetchAllMessages(RoomID: string): FetchAllMessagesReturn {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression:
        "PartitionKey = :pk AND begins_with(SortKey, :messagesPrefix)",
      ExpressionAttributeValues: {
        ":pk": `ROOM#${RoomID}`,
        ":messagesPrefix": "MESSAGES#",
      },
    };

    const command = new QueryCommand(params);

    let allMessagesResponse: QueryCommandOutput;
    try {
      allMessagesResponse = await docClient.send(command);
    } catch (error) {
      return {
        error: "Server Error fetching messages",
        statusCode: 500,
      };
    }

    const statusCode = allMessagesResponse.$metadata.httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Something Went wrong while fetching data", statusCode };
    } else if (
      !allMessagesResponse.Items ||
      allMessagesResponse.Items.length > 0
    ) {
      return { message: "No Messages in Room", data: [], statusCode: 200 };
    }

    const messages: Message[] = allMessagesResponse.Items.map((item) => {
      return {
        message: item.message,
        messageId: item.messageId,
        userID: item.userID,
        RoomID: item.RoomID,
      };
    });

    return {
      message: "Messages fetched successfully",
      data: messages,
      statusCode: 200,
    };
  }

  async deleteMessage() {}
}

const messagesManagerDB = new MessagesManagerDB(
  "chatvious",
  "PartitionKey",
  "SortKey"
);

export { messagesManagerDB };
