ARG function_directory="./websocket-endpoints/connect"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory

COPY ./tsconfig.base.json /app/src/
COPY ./types/types.ts /app/src/types/

WORKDIR /app/src/
COPY ./models/package*.json ./models/web-socket-messages.ts ./models/tsconfig.json ./models/

WORKDIR /app/src/models/
RUN npm install
# RUN npm install && npm run build

WORKDIR /app/src/websocket-endpoints/connect
COPY ${function_directory}/package*.json ./
RUN npm install
COPY ${function_directory}/connect.ts ${function_directory}/tsconfig.json ./
RUN npm run build

FROM public.ecr.aws/lambda/nodejs:20
ARG function_directory
ENV NODE_ENV=production
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /app/dist/ ./
# RUN rm -rf ${LAMBDA_TASK_ROOT}/types/

# WORKDIR ${LAMBDA_TASK_ROOT}/models/
# COPY ./models/package*.json ./
# RUN npm install

# WORKDIR ${LAMBDA_TASK_ROOT}/websocket-endpoints/connect
# COPY ${function_directory}/package*.json ./
# RUN npm install

# CMD ["websocket-endpoints/connect/connect.handler"]
CMD ["connect.handler"]