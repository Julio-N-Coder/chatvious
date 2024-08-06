import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommandOutput,
  PutCommandOutput,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { BaseModels } from "./baseModels.js";
import {
  Message,
  MessageKeys,
  MessageDB,
  FetchMessageReturn,
  FetchAllMessagesReturn,
  BaseModelsReturnTypeData,
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
  ): BaseModelsReturnTypeData<{
    messageId: string;
    sentAt: string;
  }> {
    const currentTimestamp = new Date().toISOString();
    const messageId = messageIdArg ? messageIdArg : crypto.randomUUID();

    const messageData: MessageDB = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `MESSAGES#DATE#${currentTimestamp}#MESSAGEID#${messageId}`,
      message,
      messageId,
      userID,
      RoomID,
      sentAt: currentTimestamp,
    };

    let saveMessageResponse: PutCommandOutput;
    try {
      saveMessageResponse = await this.writeItem(messageData);
    } catch (error) {
      return {
        statusCode: 500,
        error: "Server Error storing message",
      };
    }

    const statusCode = saveMessageResponse.$metadata.httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Something Went wrong while storing data", statusCode };
    }

    return {
      message: "Message stored successfully",
      data: {
        messageId,
        sentAt: currentTimestamp,
      },
      statusCode: 200,
    };
  }

  async fetchMessage(
    RoomID: string,
    messageDate: string,
    messageId: string
  ): FetchMessageReturn {
    const messageKeys: MessageKeys = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `MESSAGES#DATE#${messageDate}#MESSAGEID#${messageId}`,
    };

    let messageResponse: GetCommandOutput;
    try {
      messageResponse = await this.getItem(messageKeys);
    } catch (error) {
      return {
        statusCode: 500,
        error: "Server Error fetching message",
      };
    }

    const statusCode = messageResponse.$metadata.httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Something Went wrong while fetching data", statusCode };
    } else if (!messageResponse.Item) {
      return { error: "No data found", statusCode: 404 };
    }

    const message: Message = messageResponse.Item as Message;

    return {
      message: "Message fetched successfully",
      data: message,
      statusCode: 200,
    };
  }

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
        sentAt: item.sentAt,
      };
    });

    return {
      message: "Messages fetched successfully",
      data: messages,
      statusCode: 200,
    };
  }

  async deleteMessage(RoomID: string, messageDate: string, messageId: string) {}
}

const messagesManagerDB = new MessagesManagerDB(
  "chatvious",
  "PartitionKey",
  "SortKey"
);

export { messagesManagerDB };
