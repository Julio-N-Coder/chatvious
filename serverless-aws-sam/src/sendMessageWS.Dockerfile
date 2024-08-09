ARG function_directory="./websocket-endpoints/sendMessage"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory