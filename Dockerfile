FROM alpine

EXPOSE 7349

ADD ./timtam-receiver /

CMD ["/timtam-receiver", ">>", "/logs/timtam-log", "2>&1"]
