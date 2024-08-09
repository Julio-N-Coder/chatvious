#!/bin/bash

VIEWS_DIR="../serverless-aws-sam/src/views"

# Find all .ejs files in the views directory and run ejslint on each file
find "$VIEWS_DIR" -type f -name "*.ejs" | while read -r file; do
  npx ejslint "$file"
done