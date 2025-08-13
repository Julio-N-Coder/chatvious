use aws_config::BehaviorVersion;
use aws_credential_types::Credentials;
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_dynamodb::{Client, Error};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserItem {
    partition_key: String,
    sort_key: String,
    user_id: String,
    user_name: String,
    owned_rooms: Vec<HashMap<String, String>>,
    joined_rooms: Vec<HashMap<String, String>>,
    profile_color: String,
}

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
            for item in db_items {
                let my_item = UserItem {
                    partition_key: convert_strings(&item, "PartitionKey"),
                    sort_key: convert_strings(&item, "SortKey"),
                    user_id: convert_strings(&item, "userID"),
                    user_name: convert_strings(&item, "userName"),
                    owned_rooms: convert_rooms(&item, "ownedRooms"),
                    joined_rooms: convert_rooms(&item, "joinedRooms"),
                    profile_color: convert_strings(&item, "profileColor"),
                };
                items.push(my_item);
            }
        }
        Ok(items)
    }
}
