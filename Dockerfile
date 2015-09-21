FROM vicanso/zmq

MAINTAINER "vicansocanbico@gmail.com"

ADD ./ /timtam

RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && cd /timtam \
  && npm install --production  --registry=https://registry.npm.taobao.org

CMD cd /timtam && NODE_ENV=production node app.js
