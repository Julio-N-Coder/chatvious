FROM public.ecr.aws/lambda/nodejs:20 as builder

# WORKDIR /app/src/ejs-page-render/dashboard
WORKDIR /app/
COPY package*.json ./
RUN npm install
# not done, need to figure out how to use scripts from other directories. (check notepad notes)

# make sure to copy base tsconfig as well
COPY dashboard.ts tsconfig.json ./

RUN npm run build

FROM public.ecr.aws/lambda/nodejs:20
ENV NODE_ENV=production
WORKDIR ${LAMBDA_TASK_ROOT}
COPY package*.json ./
RUN npm install

COPY --from=builder /app/dist/* ./

CMD ["dashboard.handler"]
