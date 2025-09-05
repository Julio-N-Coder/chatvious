use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use aws_config::BehaviorVersion;
use aws_credential_types::Credentials;
use aws_sdk_dynamodb::error::SdkError;
use aws_sdk_dynamodb::operation::update_item::UpdateItemError;
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_dynamodb::{Client, Error};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserItem {
    pub partition_key: String,
    pub sort_key: String,
    pub user_id: String,
    pub user_name: String,
    pub hashed_password: String,
    pub owned_rooms: Vec<HashMap<String, String>>,
    pub joined_rooms: Vec<HashMap<String, String>>,
    pub profile_color: String,
}

#[derive(Debug)]
pub enum DynamoDBClientError {
    LimitExceeded(String),
    DynamoDbError(String),
}

impl std::fmt::Display for DynamoDBClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DynamoDBClientError::LimitExceeded(msg) => write!(f, "Limit exceeded: {}", msg),
            DynamoDBClientError::DynamoDbError(msg) => write!(f, "DynamoDB error: {}", msg),
        }
    }
}

impl std::error::Error for DynamoDBClientError {}

pub struct PasswordManager;

#[derive(Debug, Serialize, Deserialize)]
struct DynamoDbOptions {
    endpoint: Option<String>,
    region: Option<String>,
    credentials: Option<InnerCredentials>,
}

#[derive(Debug, Serialize, Deserialize)]
struct InnerCredentials {
    #[serde(rename = "accessKeyId")]
    access_key_id: Option<String>,
    #[serde(rename = "secretAccessKey")]
    secret_access_key: Option<String>,
}

pub struct DynamoDBClient {
    client: Client,
    table_name: String,
}

impl UserItem {
    pub fn build(user_name: &str, password: &str) -> Result<Self, argon2::password_hash::Error> {
        let user_id = Uuid::new_v4().to_string();
        let hashed_password = PasswordManager::hash_password(password)?;

        Ok(UserItem {
            partition_key: format!("USER#{}", user_id),
            sort_key: "PROFILE".to_string(),
            user_id,
            user_name: user_name.to_string(),
            hashed_password,
            owned_rooms: vec![],
            joined_rooms: vec![],
            profile_color: crate::get_random_color().to_string(),
        })
    }
}

impl DynamoDBClient {
    pub async fn new() -> Self {
        DynamoDBClient {
            client: Self::create_client().await,
            table_name: "chatvious".to_string(),
        }
    }

    async fn create_client() -> Client {
        // db options can be overwriten via environment variable via a json string which can be for testing, etc.
        let dynamodb_options_string =
            env::var("DYNAMODB_OPTIONS").unwrap_or_else(|_| "{}".to_string());
        let options: DynamoDbOptions = serde_json::from_str(&dynamodb_options_string)
            .unwrap_or_else(|_| DynamoDbOptions {
                endpoint: None,
                region: None,
                credentials: None,
            });

        // loads AWS defaults (from ~/.aws/credentials, IAM roles, etc.) if present
        let mut config_loader = aws_config::defaults(BehaviorVersion::latest());

        // Only overrides specific settings if they're present in the JSON
        if let Some(endpoint) = options.endpoint {
            config_loader = config_loader.endpoint_url(endpoint);
        }

        if let Some(region) = options.region {
            config_loader = config_loader.region(aws_config::Region::new(region));
        }

        if let Some(creds) = options.credentials {
            if let (Some(access_key), Some(secret_key)) =
                (creds.access_key_id, creds.secret_access_key)
            {
                let credentials = Credentials::new(access_key, secret_key, None, None, "env");
                config_loader = config_loader.credentials_provider(credentials);
            }
        }

        let config = config_loader.load().await;
        Client::new(&config)
    }

    async fn decrement_user_count(&self) -> Result<(), SdkError<UpdateItemError>> {
        self.client
            .update_item()
            .table_name(&self.table_name)
            .key("PartitionKey", AttributeValue::S("LIMITS".to_string()))
            .key("SortKey", AttributeValue::S("LIMITS".to_string()))
            .update_expression("ADD usersLimit :dec")
            .expression_attribute_values(":dec", AttributeValue::N("-1".to_string()))
            // Ensure count doesn't go below 0
            .condition_expression("usersLimit > :zero")
            .expression_attribute_values(":zero", AttributeValue::N("0".to_string()))
            .send()
            .await?;

        Ok(())
    }

    // look into indexing username or just use username as partionkey rather than an id
    // if I do use username rather than id
    // will have to update other code to fetch with username rather than id
    pub async fn find_by_name_scan(&self, attribute_value: &str) -> Result<Vec<UserItem>, Error> {
        let attribute_name = "userName";
        let result = self
            .client
            .scan()
            .table_name(self.table_name.clone())
            .filter_expression("#attr = :val")
            .expression_attribute_names("#attr", attribute_name)
            .expression_attribute_values(":val", AttributeValue::S(attribute_value.to_string()))
            .send()
            .await?;

        fn convert_strings(item: &HashMap<String, AttributeValue>, k: &str) -> String {
            item.get(k)
                .and_then(|v| v.as_s().ok())
                .unwrap_or(&String::new())
                .clone()
        }

        fn convert_rooms(
            item: &HashMap<String, AttributeValue>,
            k: &str,
        ) -> Vec<HashMap<String, String>> {
            item.get(k)
                .and_then(|v| v.as_l().ok())
                .map(|list| {
                    list.iter()
                        .filter_map(|attr| attr.as_m().ok())
                        .map(|map| {
                            map.iter()
                                .filter_map(|(k, v)| v.as_s().ok().map(|s| (k.clone(), s.clone())))
                                .collect::<HashMap<String, String>>()
                        })
                        .collect()
                })
                .unwrap_or_else(Vec::new)
        }

        let mut items = Vec::new();
        if let Some(db_items) = result.items {
            if db_items.len() > 0 {
                for item in db_items {
                    let my_item = UserItem {
                        partition_key: convert_strings(&item, "PartitionKey"),
                        sort_key: convert_strings(&item, "SortKey"),
                        user_id: convert_strings(&item, "userID"),
                        user_name: convert_strings(&item, "userName"),
                        hashed_password: convert_strings(&item, "hashedPassword"),
                        owned_rooms: convert_rooms(&item, "ownedRooms"),
                        joined_rooms: convert_rooms(&item, "joinedRooms"),
                        profile_color: convert_strings(&item, "profileColor"),
                    };
                    items.push(my_item);
                }
            }
        }
        Ok(items)
    }

    pub async fn store_new_user(&self, new_user: &UserItem) -> Result<(), DynamoDBClientError> {
        let mut user_map = HashMap::new();
        user_map.insert(
            "PartitionKey".to_string(),
            AttributeValue::S(new_user.partition_key.clone()),
        );
        user_map.insert(
            "SortKey".to_string(),
            AttributeValue::S(new_user.sort_key.clone()),
        );
        user_map.insert(
            "userID".to_string(),
            AttributeValue::S(new_user.user_id.clone()),
        );
        user_map.insert(
            "userName".to_string(),
            AttributeValue::S(new_user.user_name.clone()),
        );
        user_map.insert(
            "hashedPassword".to_string(),
            AttributeValue::S(new_user.hashed_password.clone()),
        );
        // ownedRooms and joinedRooms will always be empty for new users
        user_map.insert("ownedRooms".to_string(), AttributeValue::L(vec![]));
        user_map.insert("joinedRooms".to_string(), AttributeValue::L(vec![]));
        user_map.insert(
            "profileColor".to_string(),
            AttributeValue::S(new_user.profile_color.clone()),
        );

        // maybe try adding exponential backoff
        self.client
            .put_item()
            .table_name(&self.table_name)
            .set_item(Some(user_map))
            .send()
            .await
            .map_err(|e| {
                DynamoDBClientError::DynamoDbError(format!("Failed to store user: {}", e))
            })?;

        Ok(())
    }

    pub async fn check_and_add_user(
        &self,
        limit: i32,
        new_user: &UserItem,
    ) -> Result<(), DynamoDBClientError> {
        // Try to increment the counter with a condition
        let update_result = self
            .client
            .update_item()
            .table_name(&self.table_name)
            .key("PartitionKey", AttributeValue::S("LIMITS".to_string()))
            .key("SortKey", AttributeValue::S("LIMITS".to_string()))
            .update_expression("ADD usersLimit :inc")
            .condition_expression("usersLimit < :limit")
            .expression_attribute_values(":inc", AttributeValue::N("1".to_string()))
            .expression_attribute_values(":limit", AttributeValue::N(limit.to_string()))
            .send()
            .await;

        match update_result {
            Ok(_) => {
                // Counter successfully incremented, store new_user
                match self.store_new_user(new_user).await {
                    Ok(_) => Ok(()),
                    Err(e) => {
                        // If storing user fails, rollback the counter
                        let _ = self.decrement_user_count().await;
                        Err(e)
                    }
                }
            }
            Err(e) => {
                // Check if it's a condition failure (limit exceeded) or other error
                let error_msg = format!("{:?}", e);
                if error_msg.contains("ConditionalCheckFailedException") {
                    Err(DynamoDBClientError::LimitExceeded(format!(
                        "User limit of {} reached",
                        limit
                    )))
                } else {
                    Err(DynamoDBClientError::DynamoDbError(format!(
                        "Failed to update count",
                    )))
                }
            }
        }
    }
}

impl PasswordManager {
    /// Hash a password with a random salt using Argon2
    pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2.hash_password(password.as_bytes(), &salt)?;
        Ok(password_hash.to_string())
    }

    /// Verify a password against a stored hash
    pub fn verify_password(
        password: &str,
        hash: &str,
    ) -> Result<bool, argon2::password_hash::Error> {
        let parsed_hash = PasswordHash::new(hash)?;
        let argon2 = Argon2::default();

        match argon2.verify_password(password.as_bytes(), &parsed_hash) {
            Ok(()) => Ok(true),
            Err(argon2::password_hash::Error::Password) => Ok(false),
            Err(e) => Err(e),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::PasswordManager;

    #[test]
    fn password_hashing_and_verification_test() {
        let password = "my_secure_password123";

        // Hash the password
        let hash = PasswordManager::hash_password(password).unwrap();
        println!("Generated hash: {}", hash);

        // Verify correct password
        let is_valid = PasswordManager::verify_password(password, &hash).unwrap();
        assert!(is_valid);

        // Verify incorrect password
        let is_invalid = PasswordManager::verify_password("wrong_password", &hash).unwrap();
        assert!(!is_invalid);

        println!("Password verification test passed!");
    }
}
