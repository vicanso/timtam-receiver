// server.go
package main

import (
	"./log"
	"bytes"
	"flag"
	"fmt"
	"net"
	"os"
	"path"
)

var host = flag.String("host", "127.0.0.1", "host")
var port = flag.String("port", "7001", "port")
var logPath = flag.String("logPath", "/Users/xieshuzhou/data", "logPath")

func main() {
	flag.Parse()
	addr, err := net.ResolveUDPAddr("udp", *host+":"+*port)
	if err != nil {
		fmt.Println("Can't resolve address:", err)
		os.Exit(1)
	}
	conn, err := net.ListenUDP("udp", addr)
	if err != nil {
		fmt.Println("Error listening:", err)
		os.Exit(1)
	}

	defer conn.Close()

	for {
		read(conn)
	}
	fmt.Println("Hello World!")
}

func read(conn *net.UDPConn) {
	data := make([]byte, 1024)
	total, _, err := conn.ReadFromUDP(data)
	if err != nil {
		fmt.Println("failed to read UDP message:", err)
		return
	}

	// "|" === 124
	index := bytes.IndexByte(data, 124)
	if index == -1 {
		return
	}

	filePath := path.Join(*logPath, string(data[0:index][:]))
	buf := data[index+1 : total]
	log.WriteFile(filePath, buf)
}
