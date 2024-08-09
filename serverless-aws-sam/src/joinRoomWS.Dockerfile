ARG function_directory="./websocket-endpoints/joinRoom"

FROM public.ecr.aws/lambda/nodejs:20 AS builder
ARG function_directory