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
	cd dist && ../node_modules/.bin/mocha

coverage:
	rm -rf coverage
	./node_modules/.bin/istanbul cover node_modules/.bin/_mocha

doc:
	rm -rf ./doc
	./node_modules/.bin/ndoc --link-format "https://github.com/{package.repository}/blob/${CURR_HEAD}/{file}#L{line}"

build:
	./node_modules/.bin/babel src --out-dir dist
	cp -r ./src/fixtures dist/.

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


publish: build
	@if test 0 -ne `git status --porcelain | wc -l` ; then \
		echo "Unclean working tree. Commit or stash changes first." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git fetch ; git status | grep '^# Your branch' | wc -l` ; then \
		echo "Local/Remote history differs. Please push/pull changes." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git tag -l ${NPM_VERSION} | wc -l` ; then \
		echo "Tag ${NPM_VERSION} exists. Update package.json" >&2 ; \
		exit 128 ; \
		fi
	( git tag ${NPM_VERSION} && git push origin ${NPM_VERSION} )
	rm -rf dist/test dist/fixtures dist/examples
	npm publish https://github.com/${GITHUB_PROJ}/tarball/${NPM_VERSION}


todo:
	grep 'TODO' -n -r ./lib 2>/dev/null || test true


.PHONY: build publish lint test doc gh-pages todo
.SILENT: help lint test doc todo
