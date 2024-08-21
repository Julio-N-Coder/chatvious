ARG function_directory="./ejs-page-render/profilePage"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory

COPY ./tsconfig.json ./package*.json /app/src/

WORKDIR /app/src/
RUN npm install

WORKDIR /app/src/
COPY ./models/users.ts ./models/

COPY ./lib/*.ts ./lib/

WORKDIR /app/src/ejs-page-render/profilePage
COPY ${function_directory}/profilePage.ts ./
RUN npm run build-profilePage

FROM public.ecr.aws/lambda/nodejs:20
ARG function_directory
ENV NODE_ENV=production
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /app/dist/ ./
COPY ./views ./views

CMD ["profilePage.handler"]