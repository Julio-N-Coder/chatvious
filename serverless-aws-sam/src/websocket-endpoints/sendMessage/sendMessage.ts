import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
// remember to give lambda function permission to call the API Gateway Management API
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

// basic code is up just to see how this works (route not done)
export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const connectionId = event.requestContext.connectionId;
  const callbackUrl = `https://${domain}/${stage}`;

  // check whether user is connected to the room

  if (!event.body) {
    return {
      statusCode: 400,
      body: "Missing body",
    };
  }
  const body = JSON.parse(event.body);

  const client = new ApiGatewayManagementApiClient({ endpoint: callbackUrl });

  const requestParams = {
    ConnectionId: connectionId,
    // make sure to check if message has a value and is a string
    Data: body.message,
  };

  // fetch all connected clients in the room
  // loop through them to send messages to each of them. even the connected user
  const command = new PostToConnectionCommand(requestParams);
  try {
    await client.send(command);
  } catch (error) {
    console.log(error);
  }

  return {
    statusCode: 200,
  };
};
