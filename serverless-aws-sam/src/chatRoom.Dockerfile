ARG function_directory="./ejs-page-render/chatRoom"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory

COPY ./tsconfig.base.json /app/src/
COPY ./types/types.ts /app/src/types/

WORKDIR /app/src/
COPY ./models/package*.json ./models/users.ts ./models/rooms.ts ./models/baseModels.ts ./models/messagesDB.ts ./models/tsconfig.json ./models/

COPY ./lib/package*.json ./lib/tsconfig.json ./lib/*.ts ./lib/

WORKDIR /app/src/models/
RUN npm install && npm run build

WORKDIR /app/src/lib/
RUN npm install && npm run build

WORKDIR /app/src/ejs-page-render/chatRoom
COPY ${function_directory}/package*.json ./
RUN npm install
COPY ${function_directory}/chatRoom.ts ${function_directory}/tsconfig.json ./
RUN npm run build

FROM public.ecr.aws/lambda/nodejs:20
ARG function_directory
ENV NODE_ENV=production
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /app/dist/ ./
RUN rm -rf ${LAMBDA_TASK_ROOT}/types/
COPY ./views ./views

WORKDIR ${LAMBDA_TASK_ROOT}/models/
COPY ./models/package*.json ./
RUN npm install

WORKDIR ${LAMBDA_TASK_ROOT}/lib/
COPY ./lib/package*.json ./
RUN npm install

WORKDIR ${LAMBDA_TASK_ROOT}/ejs-page-render/chatRoom
COPY ${function_directory}/package*.json ./
RUN npm install

CMD ["ejs-page-render/chatRoom/chatRoom.handler"]