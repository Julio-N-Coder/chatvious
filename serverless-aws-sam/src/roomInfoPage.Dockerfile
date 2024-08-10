ARG function_directory="./ejs-page-render/roomInfo"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory

COPY ./tsconfig.json ./package*.json /app/src/

WORKDIR /app/src/
RUN npm install

WORKDIR /app/src/
COPY ./models/users.ts ./models/rooms.ts ./models/baseModels.ts ./models/messagesDB.ts ./models/

COPY ./lib/*.ts ./lib/

WORKDIR /app/src/ejs-page-render/roomInfo
COPY ${function_directory}/roomInfo.ts ./
RUN npm run build-roomInfo

FROM public.ecr.aws/lambda/nodejs:20
ARG function_directory
ENV NODE_ENV=production
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /app/dist/ ./
COPY ./views ./views

CMD ["roomInfo.handler"]