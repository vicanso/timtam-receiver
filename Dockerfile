FROM ubuntu

EXPOSE 7001

ADD ./timtam-receiver /

CMD ./timtam-receiver >> /data/timtam-log 2>&1