import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandOutput,
  GetCommand,
  GetCommandOutput,
  DeleteCommand,
  DeleteCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import {
  InitialConnectionDB,
  InitialConnection,
  BaseModelsReturnType,
  FetchInitialConnectionReturn,
} from "../types/types.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

class WSMessagesDBManager {
  async storeInitialConnection(
    connectionId: string,
    userID: string
  ): BaseModelsReturnType {
    const initialConnectionData: InitialConnectionDB = {
      connection: "INITIAL_CONNECTION",
      connectionId,
      userID,
    };

    const command = new PutCommand({
      TableName: "chatvious",
      Item: initialConnectionData,
    });

    let initialConnectionResponse: PutCommandOutput;
    try {
      initialConnectionResponse = await docClient.send(command);
    } catch (err) {
      return {
        error: "Something Went wrong while storing data",
        statusCode: 500,
      };
    }

    const statusCode = initialConnectionResponse.$metadata
      .httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Something Went wrong while storing data", statusCode };
    }

    return { message: "Data stored successfully", statusCode: 200 };
  }

  async fetchInitialConnection(
    connectionId: string
  ): FetchInitialConnectionReturn {
    const command = new GetCommand({
      TableName: "chatvious",
      Key: {
        connection: "INITIAL_CONNECTION",
        connectionId,
      },
    });

    let initialConnectionResponse: GetCommandOutput;
    try {
      initialConnectionResponse = await docClient.send(command);
    } catch (err) {
      return {
        error: "Something Went wrong while fetching data",
        statusCode: 500,
      };
    }

    const statusCode = initialConnectionResponse.$metadata
      .httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Something Went wrong while fetching data", statusCode };
    } else if (!initialConnectionResponse.Item) {
      return { error: "No data found", statusCode: 404 };
    }

    const initialConnectionDataDB =
      initialConnectionResponse.Item as InitialConnectionDB;
    const initialConnectionData: InitialConnection = {
      connectionId: initialConnectionDataDB.connectionId,
      userID: initialConnectionDataDB.userID,
    };

    return {
      message: "Data fetched successfully",
      data: initialConnectionData,
      statusCode: 200,
    };
  }

  async deleteInitialConnection(connectionId: string): BaseModelsReturnType {
    const command = new DeleteCommand({
      TableName: "chatvious",
      Key: {
        connection: "INITIAL_CONNECTION",
        connectionId,
      },
      ReturnValues: "ALL_OLD",
    });

    let initialConnectionResponse: DeleteCommandOutput;
    try {
      initialConnectionResponse = await docClient.send(command);
    } catch (err) {
      return {
        error: "Something Went wrong while deleting data",
        statusCode: 500,
      };
    }

    const statusCode = initialConnectionResponse.$metadata
      .httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Something Went wrong while deleting data", statusCode };
    } else if (!initialConnectionResponse.Attributes) {
      return { error: "No data found", statusCode: 404 };
    }

    return { message: "Data deleted successfully", statusCode: 200 };
  }
}

const wsMessagesDBManager = new WSMessagesDBManager();

export { wsMessagesDBManager };
