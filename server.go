// server.go
package main

import (
	"./transport"
	"bytes"
	"flag"
	log "github.com/Sirupsen/logrus"
	"github.com/tj/go-debug"
	"net"
	"os"
	"path"
)

var host = flag.String("host", "0.0.0.0", "host")
var port = flag.String("port", "7001", "port")
var logPath = flag.String("logPath", "/data/log", "logPath")
var debugLog = debug.Debug("timtam-receiver")

func main() {
	flag.Parse()

	addr, err := net.ResolveUDPAddr("udp", *host+":"+*port)
	if err != nil {
		log.Error("Can't resolve address, ", err)
		os.Exit(1)
	}
	conn, err := net.ListenUDP("udp", addr)
	if err != nil {
		log.Error("Error listening, ", err)
		os.Exit(1)
	}

	defer conn.Close()
	log.Info("start udp log server")
	for {
		read(conn)
	}
}

func read(conn *net.UDPConn) {
	data := make([]byte, 1024)
	total, _, err := conn.ReadFromUDP(data)
	if err != nil {
		log.Error("failed to read UDP message, ", err)
		return
	}

	// "\t" === 9
	index := bytes.IndexByte(data, 9)

	if index == -1 {
		return
	}

	filePath := path.Join(*logPath, string(data[0:index][:]))
	buf := data[index+1 : total]
	debugLog("buf:%s", buf)

	transport.WriteFile(filePath, buf)
}
