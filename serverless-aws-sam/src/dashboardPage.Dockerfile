ARG function_directory="./ejs-page-render/dashboard"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory

COPY ./tsconfig.base.json /app/src/
COPY ./types/types.ts /app/src/types/

WORKDIR /app/src/
COPY ./models/package*.json ./models/users.ts ./models/tsconfig.json ./models/

COPY ./lib/package*.json ./lib/tsconfig.json ./lib/navUserInfo.ts ./lib/

WORKDIR /app/src/models/
RUN npm install && npm run build

WORKDIR /app/src/lib/
RUN npm install && npm run build

WORKDIR /app/src/ejs-page-render/dashboard
COPY ${function_directory}/package*.json ./
RUN npm install

COPY ${function_directory}/dashboard.ts ${function_directory}/tsconfig.json ./
RUN npm run build

# debug dist contents in builder stage
RUN echo "the builder stage dist contents:" && ls -a /app/dist/
RUN echo "contents of ejs-page-render" && ls -a /app/dist/ejs-page-render

FROM public.ecr.aws/lambda/nodejs:20
ARG function_directory
ENV NODE_ENV=production
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /app/dist/* ./
# remove types folder

# Debug: List the contents of the directory
RUN pwd
RUN echo "the first contents of ${LAMBDA_TASK_ROOT}:" && ls -a ${LAMBDA_TASK_ROOT}
RUN echo "contents of dashboard" && ls -a dashboard

WORKDIR ${LAMBDA_TASK_ROOT}/ejs-page-render/dashboard
COPY ${function_directory}/package*.json ./
RUN npm install

# Debug: List the contents of the directory
RUN pwd
RUN echo "seccond contents of ${LAMBDA_TASK_ROOT}:" && ls -a ${LAMBDA_TASK_ROOT}

# copy views to use as well
CMD ["ejs-page-render/dashboard/dashboard.handler"]
