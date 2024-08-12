import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandOutput,
  GetCommand,
  GetCommandOutput,
  DeleteCommand,
  DeleteCommandOutput,
  UpdateCommand,
  UpdateCommandOutput,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import {
  InitialConnectionDB,
  InitialConnection,
  BaseModelsReturnType,
  InitialConnectionReturn,
  RoomConnectionDB,
  FetchRoomConnectionReturn,
  FetchAllRoomConnectionsReturn,
} from "../types/types.js";

const dynamodbOptionsString = process.env.DYNAMODB_OPTIONS || "{}";
const dynamodbOptions = JSON.parse(dynamodbOptionsString);
const client = new DynamoDBClient(dynamodbOptions);
const docClient = DynamoDBDocumentClient.from(client);

class WSMessagesDBManager {
  async storeInitialConnection(
    connectionId: string,
    userID: string,
    RoomID?: string
  ): BaseModelsReturnType {
    const initialConnectionData: InitialConnectionDB = {
      PartitionKey: "CONNECTION_INFO",
      SortKey: connectionId,
      userID,
      RoomID: RoomID ? RoomID : false, // false means they are not connected to a room
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

  async fetchInitialConnection(connectionId: string): InitialConnectionReturn {
    const command = new GetCommand({
      TableName: "chatvious",
      Key: {
        PartitionKey: "CONNECTION_INFO",
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
      RoomID: initialConnectionDataDB.RoomID,
    };

    return {
      message: "Data fetched successfully",
      data: initialConnectionData,
      statusCode: 200,
    };
  }

  async deleteInitialConnection(connectionId: string): InitialConnectionReturn {
    const command = new DeleteCommand({
      TableName: "chatvious",
      Key: {
        PartitionKey: "CONNECTION_INFO",
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

    const deletedData: InitialConnection = {
      connectionId: initialConnectionResponse.Attributes.SortKey as string,
      userID: initialConnectionResponse.Attributes.userID as string,
      RoomID: initialConnectionResponse.Attributes.RoomID as string,
    };
    return {
      message: "Data deleted successfully",
      data: deletedData,
      statusCode: 200,
    };
  }

  async storeRoomConnection(
    connectionId: string,
    userID: string,
    RoomID: string,
    userName: string,
    RoomUserStatus: "MEMBER" | "ADMIN" | "OWNER",
    profileColor: string
  ): BaseModelsReturnType {
    const roomConnectionData: RoomConnectionDB = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `CONNECTIONID#${connectionId}`,
      connectionId,
      userID,
      RoomID,
      userName,
      RoomUserStatus,
      profileColor,
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
      userName: fetchRoomConnectionResponse.Item.userName,
      RoomUserStatus: fetchRoomConnectionResponse.Item.RoomUserStatus,
      profileColor: fetchRoomConnectionResponse.Item.profileColor,
    };

    return {
      message: "Data fetched successfully",
      data: roomConnectionData,
      statusCode: 200,
    };
  }

  async updateInitialConnectionWithRoomID(
    connectionId: string,
    RoomID: string
  ): BaseModelsReturnType {
    const command = new UpdateCommand({
      TableName: "chatvious",
      Key: {
        PartitionKey: "CONNECTION_INFO",
        SortKey: connectionId,
      },
      UpdateExpression: "SET RoomID = :RoomID",
      ExpressionAttributeValues: {
        ":RoomID": RoomID,
      },
      ReturnValues: "ALL_NEW",
    });

    let updateInitialConnectionResponse: UpdateCommandOutput;
    try {
      updateInitialConnectionResponse = await docClient.send(command);
    } catch (err) {
      return {
        error: "Something Went wrong while updating data",
        statusCode: 500,
      };
    }

    const statusCode = updateInitialConnectionResponse.$metadata
      .httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Something Went wrong while updating data", statusCode };
    } else if (!updateInitialConnectionResponse.Attributes) {
      return { error: "No data found", statusCode: 404 };
    }

    return { message: "Data updated successfully", statusCode: 200 };
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
