import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandOutput,
  GetCommand,
  GetCommandOutput,
  DeleteCommand,
  DeleteCommandOutput,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import {
  InitialConnectionDB,
  InitialConnection,
  BaseModelsReturnType,
  FetchInitialConnectionReturn,
  RoomConnectionDB,
  FetchRoomConnectionReturn,
  FetchAllRoomConnectionsReturn,
} from "../types/types.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

class WSMessagesDBManager {
  async storeInitialConnection(
    connectionId: string,
    userID: string
  ): BaseModelsReturnType {
    const initialConnectionData: InitialConnectionDB = {
      PartitionKey: "INITIAL_CONNECTION",
      SortKey: connectionId,
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
        PartitionKey: "INITIAL_CONNECTION",
        SortKey: connectionId,
      },
      ConsistentRead: true,
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
      connectionId: initialConnectionDataDB.SortKey,
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
        PartitionKey: "INITIAL_CONNECTION",
        SortKey: connectionId,
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

  async storeRoomConnection(
    connectionId: string,
    userID: string,
    RoomID: string
  ): BaseModelsReturnType {
    const roomConnectionData: RoomConnectionDB = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `CONNECTIONID#${connectionId}`,
      connectionId,
      userID,
      RoomID,
    };

    const command = new PutCommand({
      TableName: "chatvious",
      Item: roomConnectionData,
    });

    let storeRoomConnectionResponse: PutCommandOutput;
    try {
      storeRoomConnectionResponse = await docClient.send(command);
    } catch (err) {
      return {
        error: "Something Went wrong while storing data",
        statusCode: 500,
      };
    }

    const statusCode = storeRoomConnectionResponse.$metadata
      .httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Something Went wrong while storing data", statusCode };
    }

    return {
      message: "Room Connection Data stored successfully",
      statusCode: 200,
    };
  }

  async fetchRoomConnection(
    RoomID: string,
    connectionId: string
  ): FetchRoomConnectionReturn {
    const command = new GetCommand({
      TableName: "chatvious",
      Key: {
        PartitionKey: `ROOM#${RoomID}`,
        SortKey: `CONNECTIONID#${connectionId}`,
      },
      ConsistentRead: true,
    });

    let fetchRoomConnectionResponse: GetCommandOutput;
    try {
      fetchRoomConnectionResponse = await docClient.send(command);
    } catch (err) {
      return {
        error: "Something Went wrong while fetching data",
        statusCode: 500,
      };
    }

    const statusCode = fetchRoomConnectionResponse.$metadata
      .httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Something Went wrong while fetching data", statusCode };
    } else if (!fetchRoomConnectionResponse.Item) {
      return { error: "No data found", statusCode: 404 };
    }

    const roomConnectionData = {
      RoomID: fetchRoomConnectionResponse.Item.RoomID,
      connectionId: fetchRoomConnectionResponse.Item.connectionId,
      userID: fetchRoomConnectionResponse.Item.userID,
    };

    return {
      message: "Data fetched successfully",
      data: roomConnectionData,
      statusCode: 200,
    };
  }

  async fetchAllRoomConnections(RoomID: string): FetchAllRoomConnectionsReturn {
    const command = new QueryCommand({
      TableName: "chatvious",
      KeyConditionExpression:
        "PartitionKey = :pk AND begins_with(SortKey, :connectionIdPrefix)",
      ExpressionAttributeValues: {
        ":pk": `ROOM#${RoomID}`,
        ":connectionIdPrefix": "CONNECTIONID#",
      },
      ConsistentRead: true,
    });

    let fetchAllRoomConnectionsResponse: QueryCommandOutput;
    try {
      fetchAllRoomConnectionsResponse = await docClient.send(command);
    } catch (err) {
      return {
        error: "Something Went wrong while fetching data",
        statusCode: 500,
      };
    }

    const statusCode = fetchAllRoomConnectionsResponse.$metadata
      .httpStatusCode as number;
    if (statusCode !== 200) {
      return {
        error: "Something Went wrong while fetching data",
        statusCode,
      };
    } else if (
      !fetchAllRoomConnectionsResponse.Items ||
      fetchAllRoomConnectionsResponse.Items.length <= 0
    ) {
      return { error: "No data found", statusCode: 404 };
    }

    const roomConnectionData =
      fetchAllRoomConnectionsResponse.Items as RoomConnectionDB[];
    return {
      message: "Data fetched successfully",
      data: roomConnectionData,
      statusCode: 200,
    };
  }

  async deleteRoomConnection(
    RoomID: string,
    connectionId: string
  ): BaseModelsReturnType {
    const command = new DeleteCommand({
      TableName: "chatvious",
      Key: {
        PartitionKey: `ROOM#${RoomID}`,
        SortKey: `CONNECTIONID#${connectionId}`,
      },
      ReturnValues: "ALL_OLD",
    });

    let deleteRoomConnectionResponse: DeleteCommandOutput;
    try {
      deleteRoomConnectionResponse = await docClient.send(command);
    } catch (error) {
      return {
        error: "Something Went wrong while deleting data",
        statusCode: 500,
      };
    }

    const statusCode = deleteRoomConnectionResponse.$metadata
      .httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Something Went wrong while deleting data", statusCode };
    } else if (!deleteRoomConnectionResponse.Attributes) {
      return { error: "No data found", statusCode: 404 };
    }

    return { message: "Data deleted successfully", statusCode: 200 };
  }
}

const wsMessagesDBManager = new WSMessagesDBManager();

export { wsMessagesDBManager };
