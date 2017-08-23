FROM fedora:26
WORKDIR /build

RUN dnf -y makecache && dnf -y install findutils make npm
RUN npm install -g typescript

ENTRYPOINT make
