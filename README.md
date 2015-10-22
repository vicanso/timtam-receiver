# Timtam Logs Collector

Collecting logs by udp protocol and pub the logs by zmq. The logs will save to /data/log/#{APP}/#{YYYY-MM-DD}.log and backup in /data/log-backup folder.

Send the logs to timtam server by [jtlogger](https://github.com/vicanso/jtlogger) .

## Installation

```bash
git clone https://github.com/vicanso/timtam.git

cd timtam

docker build .

docker run -d -p 6010:6010 -p 6000:6000/udp -v /data:/data --restart=always timtam
```

## License

MIT
