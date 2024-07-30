ARG function_directory="./ejs-page-render/chatRoom"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory

COPY ./tsconfig.base.json /app/src/
COPY ./types/types.ts /app/src/types/

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

WORKDIR ${LAMBDA_TASK_ROOT}/ejs-page-render/roomInfo
COPY ${function_directory}/package*.json ./
RUN npm install

CMD ["ejs-page-render/chatRoom/chatRoom.handler"]