FROM vicanso/iojs

MAINTAINER "vicansocanbico@gmail.com"

ADD ./ /timtam

RUN cd /timtamp \
  && npm install --production  --registry=https://registry.npm.taobao.org

CMD cd /timtam && NODE_ENV=production node app.js
