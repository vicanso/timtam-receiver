# timtam-receiver

Receive message from udp, it can archive log file by date.

Collecting logs by udp protocol and it can archive log file by date.

Logger client by node.js: [timtam-logger](https://github.com/vicanso/timtam-logger)

## docker run

```
docker run -p 7349:7349/udp -v /data/logs:/logs vicanso/timtam-receiver
```

## net.core

If the udp packet loss, you can modify the configure:

```bash
sysctl net.core | grep [rw]mem
```

```bash
sudo sysctl -w net.core.rmem_max=1048576 net.core.rmem_default=1048576
```


## License

MIT
