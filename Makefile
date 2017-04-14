NPM_PACKAGE := $(shell node -e 'process.stdout.write(require("./package.json").name)')
NPM_VERSION := $(shell node -e 'process.stdout.write(require("./package.json").version)')

TMP_PATH    := /tmp/${NPM_PACKAGE}-$(shell date +%s)

REMOTE_NAME ?= origin
REMOTE_REPO ?= $(shell git config --get remote.${REMOTE_NAME}.url)

CURR_HEAD   := $(firstword $(shell git show-ref --hash HEAD | cut --bytes=-6) master)
GITHUB_PROJ := akst/${NPM_PACKAGE}


help:
	echo "make build      - builds the source"
	echo "make help       - Print this help"
	echo "make lint       - Lint sources with JSHint"
	echo "make test       - Lint sources and run all tests"
	echo "make doc        - Build API docs"
	echo "make gh-pages   - Build and push API docs into gh-pages branch"
	echo "make publish    - Set new version tag and publish npm package"
	echo "make todo       - Find and list all TODOs"


lint:
	./node_modules/.bin/eslint src


test: build
	cd lib && ../node_modules/.bin/mocha

coverage:
	rm -rf coverage
	./node_modules/.bin/istanbul cover node_modules/.bin/_mocha

doc:
	rm -rf ./doc
	./node_modules/.bin/ndoc --link-format "https://github.com/{package.repository}/blob/${CURR_HEAD}/{file}#L{line}"

build:
	./node_modules/.bin/babel src --out-dir lib
	cp -r ./src/fixtures lib/.

publish-build:
	rm -rf lib
	./node_modules/.bin/babel src --out-dir lib
	rm -rf lib/test lib/fixtures lib/examples
	cp package.json lib/.

gh-pages:
	@if test -z ${REMOTE_REPO} ; then \
		echo 'Remote repo URL not found' >&2 ; \
		exit 128 ; \
		fi
	$(MAKE) doc && \
		cp -r ./doc ${TMP_PATH} && \
		touch ${TMP_PATH}/.nojekyll
	cd ${TMP_PATH} && \
		git init && \
		git add . && \
		git commit -q -m 'Recreated docs'
	cd ${TMP_PATH} && \
		git remote add remote ${REMOTE_REPO} && \
		git push --force remote +master:gh-pages
	rm -rf ${TMP_PATH}


publish: publish-build
	npm version patch
	cd lib && npm publish
	cd ..
	git push origin master --tags


todo:
	grep 'TODO' -n -r ./lib 2>/dev/null || test true


.PHONY: build publish lint test doc gh-pages todo
.SILENT: help lint test doc todo
