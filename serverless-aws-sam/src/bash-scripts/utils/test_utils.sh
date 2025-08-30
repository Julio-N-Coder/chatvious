if !(return 0 2>/dev/null); then
	echo "Can't run script directly"
	exit 1
fi

check_access_token() {
	if [[ "$access_token" == "null" || -z "$access_token" ]]; then
		echo "ERROR: access_token is missing or empty" >&2
		exit 1
	fi
}

check_id_token() {
	if [[ "$id_token" == "null" || -z "$id_token" ]]; then
		echo "ERROR: id_token is missing or empty" >&2
		exit 1
	fi
}
