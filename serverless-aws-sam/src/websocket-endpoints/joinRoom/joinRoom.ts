import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  event.body;
  event.requestContext;
  event.stageVariables;
  event.isBase64Encoded;
  return {
    statusCode: 200,
  };
};
