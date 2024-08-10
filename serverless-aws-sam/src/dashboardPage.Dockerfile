ARG function_directory="./ejs-page-render/dashboard"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory

# Copy needed files
COPY ./tsconfig.json ./package*.json /app/src/

WORKDIR /app/src/
RUN npm install

COPY ./types/types.ts /app/src/types/

COPY ./models/users.ts ./models/rooms.ts ./models/

COPY ./lib/*.ts ./lib/

WORKDIR /app/src/ejs-page-render/dashboard
COPY ${function_directory}/dashboard.ts ./

WORKDIR /app/src/
RUN npm run build-dashboard

FROM public.ecr.aws/lambda/nodejs:20
ARG function_directory
ENV NODE_ENV=production
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /app/dist/ ./
COPY ./views ./views

CMD ["dashboard.handler"]
