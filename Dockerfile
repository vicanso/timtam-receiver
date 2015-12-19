FROM ubuntu

ADD ./timtam-receiver /

CMD ./timtam-receiver >> /timtam-log 2>&1