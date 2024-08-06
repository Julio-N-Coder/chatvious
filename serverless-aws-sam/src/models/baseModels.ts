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

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

class BaseModels {
  protected tableName: string;
  protected pk: string;
  protected sk: string;

  constructor(tableName: string, pk: string, sk: string) {
    this.tableName = tableName;
    this.pk = pk;
    this.sk = sk;
  }

  protected async writeItem(item: any): Promise<PutCommandOutput> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    return await docClient.send(command);
  }

  protected async getItem(
    key: Record<string, any>,
    ConsistentRead: boolean
  ): Promise<GetCommandOutput> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: key,
      ConsistentRead: ConsistentRead ? true : false,
    });

    return await docClient.send(command);
  }

  protected async deleteItem(
    key: Record<string, any>,
    returnDeletedValues?: boolean
  ): Promise<DeleteCommandOutput> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: key,
      ReturnValues: returnDeletedValues ? "ALL_OLD" : "NONE",
    });

    return await docClient.send(command);
  }

  protected async queryItems(
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>,
    ConsistentRead: boolean
  ): Promise<QueryCommandOutput> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ConsistentRead: ConsistentRead ? true : false,
    });

    return await docClient.send(command);
  }
}
export { BaseModels };
