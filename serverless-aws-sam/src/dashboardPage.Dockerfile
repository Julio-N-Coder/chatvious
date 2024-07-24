ARG function_directory="./ejs-page-render/dashboard"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory

# Copy needed files
COPY ./tsconfig.base.json /app/src/
COPY ./types/types.ts /app/src/types/

WORKDIR /app/src/
COPY ./models/package*.json ./models/users.ts ./models/tsconfig.json ./models/

COPY ./lib/package*.json ./lib/tsconfig.json ./lib/*.ts ./lib/

# Build typescript code
WORKDIR /app/src/models/
RUN npm install && npm run build

WORKDIR /app/src/lib/
RUN npm install && npm run build

WORKDIR /app/src/ejs-page-render/dashboard
COPY ${function_directory}/package*.json ./
RUN npm install
COPY ${function_directory}/dashboard.ts ${function_directory}/tsconfig.json ./
RUN npm run build

FROM public.ecr.aws/lambda/nodejs:20
ARG function_directory
ENV NODE_ENV=production
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /app/dist/ ./
RUN rm -rf ${LAMBDA_TASK_ROOT}/types/
# copy views to render ejs pages
COPY ./views ./views

RUN echo "final stage directory output" && ls

# Install packages
WORKDIR ${LAMBDA_TASK_ROOT}/models/
COPY ./models/package*.json ./
RUN npm install

WORKDIR ${LAMBDA_TASK_ROOT}/lib/
COPY ./lib/package*.json ./
RUN npm install

WORKDIR ${LAMBDA_TASK_ROOT}/ejs-page-render/dashboard
COPY ${function_directory}/package*.json ./
RUN npm install

CMD ["ejs-page-render/dashboard/dashboard.handler"]
