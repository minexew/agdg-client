
AGDG_CLIENT_SOURCE := $(shell find src/agdg-client -type f -name '*.ts')
MGMT_CONSOLE_SOURCE := $(shell find src/mgmt-console -type f -name '*.ts')

all : agdg-client mgmt-console

clean :
	rm -rf dist/*.html dist/*.js dist/*.js.map

agdg-client : dist/index.html dist/agdg-client.js
mgmt-console : dist/mgmt-console.html dist/mgmt-console.js

dist/agdg-client.js : $(AGDG_CLIENT_SOURCE)
	tsc --out $@ $(AGDG_CLIENT_SOURCE)

dist/mgmt-console.js : $(MGMT_CONSOLE_SOURCE)
	tsc --out $@ $(MGMT_CONSOLE_SOURCE)

dist/%.html : src/agdg-client/%.html
	cp $< $@

dist/%.html : src/mgmt-console/%.html
	cp $< $@
