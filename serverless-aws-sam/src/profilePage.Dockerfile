ARG function_directory="./ejs-page-render/profilePage"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory