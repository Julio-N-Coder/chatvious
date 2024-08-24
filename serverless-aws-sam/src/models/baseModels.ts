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
import { BaseKeys } from "../types/types.js";

const dynamodbOptionsString = process.env.DYNAMODB_OPTIONS || "{}";
const dynamodbOptions = JSON.parse(dynamodbOptionsString);
const client = new DynamoDBClient(dynamodbOptions);
const docClient = DynamoDBDocumentClient.from(client);

interface BaseItemData extends BaseKeys {
  [key: string]: any;
}

class BaseModels {
  protected tableName: string;
  protected pk: string;
  protected sk: string;

  constructor(tableName: string, pk: string, sk: string) {
    this.tableName = tableName;
    this.pk = pk;
    this.sk = sk;
  }

  protected async putItem(item: BaseItemData): Promise<PutCommandOutput> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    return await docClient.send(command);
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

    return await docClient.send(command);
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

    return await docClient.send(command);
  }
}
export { BaseModels };
