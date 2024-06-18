import { PostConfirmationEvent } from "../types.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// comamnd to invoke locally "sam local invoke saveUserDataFunction -e events/saveUserDataEvent.json"

export const saveUserData = async (event: PostConfirmationEvent) => {
  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    // save the user data to DynamoDB
    // return an error message if the user data could not be saved
    const client = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(client);
    
    const userDataCommand = new PutCommand({
      TableName: "chatvious-users",
      Item: {
        "sub-id": event.request.userAttributes.sub,
        username: event.userName,
        email: event.request.userAttributes.email,
      }
    });
    
    // check for an error and return an error if there is an problem
    const res = await docClient.send(userDataCommand);
    console.log("res: ", res);
    return event;
  }
  
  return event;
};
