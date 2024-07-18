#!/bin/bash

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

lint_ejs_files() {
  local directory="$1"

  # Loop through all files and directories in the current directory
  for file in "$directory"/*; {
    if [[ -d "$file" ]]; then
      lint_ejs_files "$file"
      # If it's an .ejs file, run ejs-lint
    elif [[ -f "$file" && "$file" == *.ejs ]]; then
      echo "Linting $file"
      npx ejs-lint "$file"
    fi
  }
}

lint_ejs_files "$SCRIPT_DIR/views"