import { handler } from "../disconnect.js";
import restAPIEventBase from "../../../../events/websocketApiDisconnectEvent.json";
import { wsMessagesDBManager } from "../../../models/web-socket-messages.js";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "@jest/globals";
import { APIGatewayWebSocketDisconnectEvent } from "../../../types/types.js";

const restAPIEvent = restAPIEventBase as APIGatewayWebSocketDisconnectEvent;
const connectionId = restAPIEvent.requestContext.connectionId;
let userID: string;

// continue once the joinRoom route is done
beforeAll(async () => {});

afterAll(async () => {});

describe("A test for the disconnect route on the api gateway websocket", () => {});
