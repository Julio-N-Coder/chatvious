# **Chatvious Project**

### Hello and welcome to my real time chat app project I made.

This is a project I am made to learn more about web development and improve my skills. I Have learned a lot about web development when making this project and about serverless technologies as well. Thank you for stopping by to read this and I hope you enjoy what I have made.

### Related Chatvious resources

If you Would like to see a more in depth explaination of how chatvious works, here is a link to the page on my portfolio website. <https://coding-wielder.com/chatvious-info>

If you would just like to check out chatvious for yourself, Here is the link to the main page. <https://main.chatvious.coding-wielder.com/>

## Resources and technologies used to make this project

### Front End

The front end and static resources of this website are made by a few different things. The main, about page and auth pages are made with **React** and are bundled using **webpack**. The rest of the pages are made with **Ejs** and javascript and their static assest are also bundled with webpack. All the pages use **tailwind** with **daisy** ui for the css.

### Backend

There are some pages that are rendered in the backend with **Ejs**. The reason ejs is choosen is simply because I wanted to try server side rendering. There are definitly some problems with ejs such as not having a proper formater and bundling problems but EJS looks to be the best server side rendering tools for nodejs so far. Ejs can also be used in the browser which is used to render elements.

I wanted to try working with serverless technologies and all my infrastructure is built on aws with the help of the **AWS Serverless Application Model (AWS SAM)** which is an infrastructure as code tool to help provision AWS infrustructure. The AWS infrustructure used to build this app are as follows.

- **API Gateway (REST and WebSockets)**: The app utilizes both REST and WebSocket APIs to handle HTTP requests and real-time communication.
- **Lambda Functions (compute)**: The backend compute which is mainly invoked and ran by Api Gateway
- **DynamoDB (storage)**: DynamoDB is used as the database for this project.
- **Content Delivery**: The static front-end content is served through an Amazon CloudFront distribution, sourced from an S3 bucket.

CI/CD with github actions is used to help automate the workflow

## How to use the project

If you would like to build the project your self to try it out, this section can help you.

### FrontEnd

For the main, about page and auth pages, the code and assets are stored in the **client** directory. navigate there and run `npm run build` to bundle the code or `npm run build:prod` for a production build. Use `npm run serve` to get a dev server with hot module reloading. This only builds the front end.

For the Static assets of the ejs pages, those are in the **ejs-static** directory. To build static assets, make sure to be in that directory to run commands and it has the same build and build:prod commands as the client directory. It also has 2 other commands. The first is `npm run dev`. The reason this is made is to be able to see the visual updates on my ejs rendered pages faster. without this, the local api gateway that AWS SAM provides would have to be started which takes some time for the containers to start up. This takes even longer if the lambda functions have to be built. The second command is `npm run static`. The reason this command is made is for my static assets to be served when running the ejs pages in lambda functions locally with api gateway. This command also serves the static assets from the client directory so you can see the other static pages served. It also starts a simple websocket server that connects to my chat-room page with simple functionality. This is to be able to see how new chat messages are rendered and test the client websocket functionality.

### BackEnd

As of right now, the backend can't be deployed easily without making manual changes of some hardcoded values related to my own aws account's resources. Some of those are the Parameters in the template.yaml file for resources like manually created certificates and hardcoded domains in my webpack files to replaces some values in the code. If you would like to try to mess around with the backend, here is some info about it and how to test and run it locally.

The Backend is in the **serverless-aws-sam directory**. Make sure to navigate to the **src** directory of that directory, run `npm install`. You also need to make sure you have **Cargo Lambda** installed. Cargo Lambda is needed to build the lambda functions that are written in rust. Here is the website if you would like to know how to install Cargo Lambda <https://www.cargo-lambda.info/guide/installation.html>. Lastly, you either need mkcert installed or insert your own tls certificate and key into the **certs** directory. If you have mkcert installed, running **dev.sh** will automatically create the files for you. To manualy create them, you can run `mkcert -cert-file chatvious-cert.pem -key-file chatvious-cert-key.pem localhost sub.localhost main.localhost sub.main.localhost`. Make sure you have ran `mkcert -install` that installs the local certificate authority on your computer.

There is a nice build script to automatically build the backend. All you have to do is run **./serverless-aws-sam/build.sh --all** to build and bundle the project. This will turn your AWS Sam template **(template.yaml)** into a cloudformation template. This also packages all the functions in the template and all the built resouces into a **.aws-sam** directory. If you are wondering why there is a Makefile, this is so I am able to package the views directory which contains the ejs templates into the lambda functions that use ejs to render pages. If you would like to run a local version of a api gateway (Rest Api), there is a nice dev script at the root of the chatvious project. First off you have to have docker running in order for this to work. Then run the **dev.sh** bash script which automatically starts the needed resources such as serving the static contect, starting a dynamodb container and other mocks. From there, it should start locally and be accessible on https://sub.main.localhost:8040 for the frontend and https://main.localhost:3000 for the backend. If you want to read more about AWS Sam, here is the documentation <https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html>.

### Other Utils

There are Other utils that might be useful for development and most are written in bash. The **bash-scripts/dynamodb-start.sh** script can be used to start Dynamodb with with docker. Most scripts in the **bash-scripts/utils** directory are meant to be sourced to use it's utilities in other bash scripts. A notible one is the **mocks.sh** utility script. The mocks.sh utility script helps with starting and cleaning up mocks such as Dynamodb. One very helpful mock that this script helps setup is the mock for the aws ssm parameter store.

The mock for the aws ssm parameter store is at **serverless-aws-sam/src/utils/aws-mock/mock_ssm_server.py**. This script can simply be ran by itself and it would start serving keys that can be fetched as if you were fetching the keys from aws itself. Just point the endpoint at http://localhost:8009. This is a lightweight mock and doesn't provide the full funcionality of ssm parameter store. All it does is serve the keys when requested which is all the functionality needed for now.

The **serverless-aws-sam/src/bash-scripts/local-invoke.sh** bash script is usefull when wanting to run a lambda function on it's own with sam local invoke. This can help when developing a lambda function and testing whether or not it successfully runs. A lambda function might not be able to be ran with this script and will have to be added to the script to be able to be used. To run the script, just use **local-invoke.sh LogicalID** where the LogicalID is the same as the logical id's in the template.yaml file. More specifically, they are the first key names under "Resources:".

### Tests

Before running the test, make sure that the lambda functions are built. There are a few different tests that can be ran which depend on the language the lambda functions were written in. The first are javascript unit test. First, change into the **serverless-aws-sam directory/src** directory and install the npm dependancies if you haven't already with `npm install`. Then to run `npm run test`.

To run test for the lambda authorizer that is written in Java, simply run the **serverless-aws-sam/src/bash-scripts/tests/lambda_authorizer_tests.sh** bash script.

To run test for the rust lambda functions, simply run the **serverless-aws-sam/src/bash-scripts/tests/rust_lambda_tests.sh** bash script which run both the rust unit test and integration test.

To run the javascript integration test, simply run the **serverless-aws-sam/src/integration/integration.py** python script.

### Dynamodb

Here is a schema for the current items stored in Dynamodb

#### Limits

| Attribute    | Example Value | Notes                 |
| ------------ | ------------- | --------------------- |
| PartitionKey | `LIMITS`      | PK                    |
| SortKey      | `LIMITS`      | SK                    |
| usersAmount  | number        | Total number of users |
| totalRooms   | number        | Total number of rooms |

#### UserInfo

| Attribute      | Example Value              | Notes                       |
| -------------- | -------------------------- | --------------------------- |
| PartitionKey   | `USER#${userID}`           | PK                          |
| SortKey        | `PROFILE`                  | SK                          |
| userID         | UUID                       | Unique user identifier      |
| userName       | string (username)          |                             |
| hashedPassword | string (hashed password)   |                             |
| ownedRooms     | `[ { RoomID, roomName } ]` | Rooms created by this user  |
| joinedRooms    | `[ { RoomID, roomName } ]` | Rooms this user has joined  |
| profileColor   | string (color)             | User’s chosen profile color |

#### RoomInfo

| Attribute       | Example Value    | Notes                     |
| --------------- | ---------------- | ------------------------- |
| PartitionKey    | `ROOM#${RoomID}` | PK                        |
| SortKey         | `METADATA`       | SK                        |
| RoomID          | UUID             |                           |
| roomName        | string (name)    |                           |
| createdAt       | ISODate          | Room creation time        |
| roomMemberCount | number           | Count of room members     |
| messageCount    | number           | Count of messages in room |

#### RoomMember

| Attribute      | Example Value                  | Notes                |
| -------------- | ------------------------------ | -------------------- |
| PartitionKey   | `ROOM#${RoomID}`               | PK                   |
| SortKey        | `MEMBERS#USERID#${userID}`     | SK                   |
| userID         | UUID                           |                      |
| userName       | string (username)              |                      |
| RoomID         | UUID                           |                      |
| RoomUserStatus | `MEMBER` \| `ADMIN` \| `OWNER` | Role of user in room |
| joinedAt       | ISODate                        | When user joined     |
| profileColor   | string (color)                 | User’s profile color |

#### JoinRequest

| Attribute         | Example Value                    | Notes                |
| ----------------- | -------------------------------- | -------------------- |
| PartitionKey      | `ROOM#${RoomID}`                 | PK                   |
| SortKey           | `JOIN_REQUESTS#USERID#${userID}` | SK                   |
| RoomID            | UUID                             |                      |
| fromUserID        | UUID                             | Requesting user      |
| fromUserName      | string (username)                |                      |
| roomName          | string (name)                    |                      |
| sentJoinRequestAt | ISODate                          | Request timestamp    |
| profileColor      | string (color)                   |                      |
| expires           | TTL (UnixEpochTime)              | When request expires |

#### InitialConnection

| Attribute    | Example Value     | Notes                 |
| ------------ | ----------------- | --------------------- |
| PartitionKey | `CONNECTION_INFO` | PK                    |
| SortKey      | `connectionId`    | SK                    |
| userID       | UUID              |                       |
| RoomID       | UUID              |                       |
| expires      | TTL               | Connection expiration |

#### RoomConnection

| Attribute      | Example Value                  | Notes                 |
| -------------- | ------------------------------ | --------------------- |
| PartitionKey   | `ROOM#${RoomID}`               | PK                    |
| SortKey        | `CONNECTIONID#${connectionId}` | SK                    |
| RoomID         | UUID                           |                       |
| connectionId   | UUID                           |                       |
| userID         | UUID                           |                       |
| userName       | string (username)              |                       |
| RoomUserStatus | `MEMBER` \| `ADMIN` \| `OWNER` | Role of user          |
| profileColor   | string (color)                 |                       |
| expires        | TTL                            | Connection expiration |

#### Message

| Attribute      | Example Value                                     | Notes             |
| -------------- | ------------------------------------------------- | ----------------- |
| PartitionKey   | `ROOM#${RoomID}`                                  | PK                |
| SortKey        | `MESSAGES#DATE#${ISODate}#MESSAGEID#${messageId}` | SK                |
| message        | string                                            | Message body      |
| messageId      | UUID                                              | Unique message ID |
| userID         | UUID                                              | Sender            |
| userName       | string (username)                                 |                   |
| RoomUserStatus | `MEMBER` \| `ADMIN` \| `OWNER`                    | Role of sender    |
| profileColor   | string (color)                                    |                   |
| RoomID         | UUID                                              | Room reference    |
| sentAt         | ISODate                                           | Message timestamp |

## Conclusion

Thank you for taking some time to check out what I have built and I hope you like it. I have learned a lot about web development when working on this project. This project was originally just a nodejs project with the express framework but I changed that with technologies I wanted to try out. Thanks again and I hope you have a wonderful day!
