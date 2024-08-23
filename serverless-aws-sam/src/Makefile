build-dashboardPage:
	cp -r ./views $(ARTIFACTS_DIR)/views

	npx esbuild ./ejs-page-render/dashboard/dashboard.ts --bundle --minify --platform=node --target=es2020 --outfile=$(ARTIFACTS_DIR)/dashboard.js

build-roomInfoPage:
	cp -r ./views $(ARTIFACTS_DIR)/views

	npx esbuild ./ejs-page-render/roomInfo/roomInfo.ts --bundle --minify --platform=node --target=es2020 --outfile=$(ARTIFACTS_DIR)/roomInfo.js

build-chatRoom:
	cp -r ./views $(ARTIFACTS_DIR)/views

	npx esbuild ./ejs-page-render/chatRoom/chatRoom.ts --bundle --minify --platform=node --target=es2020 --outfile=$(ARTIFACTS_DIR)/chatRoom.js
build-profilePage:
	cp -r ./views $(ARTIFACTS_DIR)/views

	npx esbuild ./ejs-page-render/profilePage/profilePage.ts --bundle --minify --platform=node --target=es2020 --outfile=$(ARTIFACTS_DIR)/profilePage.js