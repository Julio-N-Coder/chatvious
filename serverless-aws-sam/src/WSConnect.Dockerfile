ARG function_directory="./websocket-endpoints/connect"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory