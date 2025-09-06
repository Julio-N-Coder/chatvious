import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandOutput,
  GetCommand,
  GetCommandOutput,
  DeleteCommand,
  DeleteCommandOutput,
  BatchWriteCommand,
  BatchWriteCommandOutput,
  UpdateCommand,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { BaseKeys } from "../types/types.js";

interface BaseItemData extends BaseKeys {
  [key: string]: any;
}

class BaseModels {
  docClient: DynamoDBDocumentClient;
  protected tableName: string;
  protected pk: string;
  protected sk: string;

  constructor() {
    this.tableName = process.env.CHATVIOUSTABLE_TABLE_NAME
      ? process.env.CHATVIOUSTABLE_TABLE_NAME
      : "chatvious";

    this.pk = "PartitionKey";
    this.sk = "SortKey";

    const dynamodbOptionsString = process.env.DYNAMODB_OPTIONS || "{}";
    const dynamodbOptions = JSON.parse(dynamodbOptionsString);
    const client = new DynamoDBClient(dynamodbOptions);

    this.docClient = DynamoDBDocumentClient.from(client);
  }

  protected async putItem(item: BaseItemData): Promise<PutCommandOutput> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    return await this.docClient.send(command);
  }

  protected async getItem(
    key: BaseKeys,
    ConsistentRead?: boolean,
    ProjectionExpression?: string
  ): Promise<GetCommandOutput> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: key,
      ConsistentRead: ConsistentRead ? true : false,
    });
    if (ProjectionExpression) {
      command.input.ProjectionExpression = ProjectionExpression;
    }

    return await this.docClient.send(command);
  }

  protected async deleteItem(
    key: BaseKeys,
    returnDeletedValues?: boolean
  ): Promise<DeleteCommandOutput> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: key,
      ReturnValues: returnDeletedValues ? "ALL_OLD" : "NONE",
    });

    return await this.docClient.send(command);
  }

  /**
   * Adds an integer within a range, to an attribute value on an item. Can be negative
   *
   * Check for bound/limit error with - error.name === "ConditionalCheckFailedException"
   */
  protected async addToAttributeValue(
    key: BaseKeys,
    attributeName: string,
    amount: number,
    limit: number
  ): Promise<UpdateCommandOutput> {
    let conditionExpression: string;
    let expressionAttributeValues: any;

    if (amount > 0) {
      conditionExpression = "#attributeName <= :maxAllowed";
      expressionAttributeValues = {
        ":amount": amount,
        ":zero": 0,
        ":maxAllowed": limit - amount,
      };
    } else if (amount < 0) {
      conditionExpression = "#attributeName >= :minRequired";
      expressionAttributeValues = {
        ":amount": amount,
        ":zero": 0,
        ":minRequired": Math.abs(amount),
      };
    } else {
      // Amount is 0, no change needed
      throw new Error("Amount is 0");
    }

    const addMessageCountCommand = new UpdateCommand({
      TableName: this.tableName,
      Key: key,
      UpdateExpression:
        "SET messageCount = if_not_exists(messageCount, :zero) + :amount",
      ConditionExpression: conditionExpression,
      ExpressionAttributeNames: {
        "#attributeName": attributeName,
      },
      ExpressionAttributeValues: expressionAttributeValues,
    });

    return await this.docClient.send(addMessageCountCommand);
  }

  protected async batchWrite(
    deleteKeys?: BaseKeys[],
    putItems?: BaseItemData[]
  ): Promise<BatchWriteCommandOutput> {
    const requests = [];
    if (!deleteKeys) deleteKeys = [];
    if (!putItems) putItems = [];

    for (const item of putItems) {
      requests.push({
        PutRequest: {
          Item: item,
        },
      });
    }

    for (const key of deleteKeys) {
      requests.push({
        DeleteRequest: {
          Key: key,
        },
      });
    }

    const command = new BatchWriteCommand({
      RequestItems: {
        [this.tableName]: requests,
      },
    });

    return await this.docClient.send(command);
  }
}
export { BaseModels };
