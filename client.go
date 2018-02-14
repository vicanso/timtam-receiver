package main

import (
	"fmt"
	"log"
	"net"
	"time"
)

func main() {
	conn, err := net.Dial("udp", "127.0.0.1:7349")
	if err != nil {
		fmt.Printf("Some error %v", err)
		return
	}
	max := 1000 * 1000
	start := time.Now()
	for index := 0; index < max; index++ {
		conn.Write([]byte("pike\t{when-iso-ms} - {client-ip} - \"{method} {uri}\" {status} {size} {latency-ms}ms"))
	}
	log.Print(time.Since(start))
	conn.Close()
}
