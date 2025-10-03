import { UpdateCommandOutput } from "@aws-sdk/lib-dynamodb";
import { BaseModelsReturnType } from "../types/types.js";
import { BaseModels } from "./baseModels.js";

class LimitsManager extends BaseModels {
  /**
   * Attempts to add the amount to totalRooms counter with a limit check
   * @param amount - Amount to add to totalRooms. can be negative
   * @returns BaseModelsReturnType - message if increment succeeded, error if limit reached
   */
  async addRoomsCount(amount: number): BaseModelsReturnType {
    const ROOM_LIMIT = 1000;
    let keys = {
      PartitionKey: "LIMITS",
      SortKey: "LIMITS",
    };

    let addRoomsCountResponse: UpdateCommandOutput;
    try {
      addRoomsCountResponse = await this.addToAttributeValue(
        keys,
        "totalRooms",
        amount,
        ROOM_LIMIT
      );
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        if (amount < 0) {
          return {
            error: "Cannot reduce Room Count below zero",
            statusCode: 400,
          };
        } else {
          return { error: "Room limit reached", statusCode: 429 };
        }
      }
      return { error: "Database error", statusCode: 500 };
    }

    const statusCode = addRoomsCountResponse.$metadata
      ?.httpStatusCode as number;
    if (statusCode !== 200) {
      return { error: "Database error", statusCode: statusCode };
    }

    return { message: "Room Count Updated Successfully", statusCode: 200 };
  }
}

const limitsManager = new LimitsManager();

export default limitsManager;
