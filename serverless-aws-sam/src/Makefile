build-dashboardPage:
	mkdir -p $(ARTIFACTS_DIR)/views/
	cp ./views/dashboard.ejs $(ARTIFACTS_DIR)/views/dashboard.ejs
	cp -r ./views/components $(ARTIFACTS_DIR)/views/components

	npx esbuild ./ejs-page-render/dashboard/dashboard.ts \
		--bundle \
		--minify \
		--platform=node \
		--target=es2020 \
		--outfile=$(ARTIFACTS_DIR)/dashboard.js

build-roomInfoPage:
	mkdir -p $(ARTIFACTS_DIR)/views/
	cp ./views/roomInfo.ejs $(ARTIFACTS_DIR)/views/roomInfo.ejs
	cp -r ./views/components $(ARTIFACTS_DIR)/views/components

	npx esbuild ./ejs-page-render/roomInfo/roomInfo.ts \
		--bundle \
		--minify \
		--platform=node \
		--target=es2020 \
		--outfile=$(ARTIFACTS_DIR)/roomInfo.js

build-chatRoom:
	mkdir -p $(ARTIFACTS_DIR)/views/
	cp ./views/chatRoom.ejs $(ARTIFACTS_DIR)/views/chatRoom.ejs
	cp -r ./views/components $(ARTIFACTS_DIR)/views/components

	npx esbuild ./ejs-page-render/chatRoom/chatRoom.ts \
		--bundle \
		--minify \
		--platform=node \
		--target=es2020 \
		--outfile=$(ARTIFACTS_DIR)/chatRoom.js

build-profilePage:
	mkdir -p $(ARTIFACTS_DIR)/views/
	cp ./views/profilePage.ejs $(ARTIFACTS_DIR)/views/profilePage.ejs
	cp -r ./views/components $(ARTIFACTS_DIR)/views/components

	npx esbuild ./ejs-page-render/profilePage/profilePage.ts \
		--bundle \
		--minify \
		--platform=node \
		--target=es2020 \
		--outfile=$(ARTIFACTS_DIR)/profilePage.js