ARG function_directory="./roomRoutes/acceptJoinRequest"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory

COPY ./tsconfig.base.json /app/src/
COPY ./types/types.ts /app/src/types/

WORKDIR /app/src/
COPY ./models/package*.json ./models/users.ts ./models/rooms.ts ./models/tsconfig.json ./models/

WORKDIR /app/src/models/
RUN npm install && npm run build

WORKDIR /app/src/roomRoutes/acceptJoinRequest
COPY ${function_directory}/package*.json ./
RUN npm install
COPY ${function_directory}/acceptJoinRequest.ts ${function_directory}/tsconfig.json ./
RUN npm run build

FROM public.ecr.aws/lambda/nodejs:20
ARG function_directory
ENV NODE_ENV=production
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /app/dist/ ./
RUN rm -rf ${LAMBDA_TASK_ROOT}/types/

WORKDIR ${LAMBDA_TASK_ROOT}/models/
COPY ./models/package*.json ./
RUN npm install

WORKDIR ${LAMBDA_TASK_ROOT}/roomRoutes/acceptJoinRequest
COPY ${function_directory}/package*.json ./
RUN npm install

CMD ["roomRoutes/acceptJoinRequest/acceptJoinRequest.handler"]
