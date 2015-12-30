// server.go
package main

import (
	"./transport"
	"bytes"
	"flag"
	log "github.com/Sirupsen/logrus"
	"github.com/tj/go-debug"
	"io"
	"net"
	"os"
	"path"
)

var host = flag.String("host", "0.0.0.0", "host")
var port = flag.String("port", "7001", "port")
var logPath = flag.String("logPath", "/data/logs", "logPath")
var debugLog = debug.Debug("timtam-receiver")
var logSubDict = make(map[string][]net.Conn)

func main() {
	flag.Parse()
	go startTCPServer()
	startUDPServer()
}

func startUDPServer() {
	addr, err := net.ResolveUDPAddr("udp", *host+":"+*port)
	if err != nil {
		log.Error("Can't resolve udp address, ", err)
		os.Exit(1)
	}
	conn, err := net.ListenUDP("udp", addr)
	if err != nil {
		log.Error("udp listening, ", err)
		os.Exit(1)
	}

	defer conn.Close()
	log.Info("start udp log server")
	for {
		UDPRead(conn)
	}
}

func startTCPServer() {
	listener, err := net.Listen("tcp", *host+":"+*port)
	if err != nil {
		log.Error("tcp listening, ", err)
		os.Exit(1)
	}
	defer listener.Close()
	log.Info("start tcp log server")
	for {
		//wait for client
		conn, err := listener.Accept()
		if err != nil {
			log.Error("connection error, ", err)
		}
		go TCPRead(conn)
	}
}

func TCPRead(conn net.Conn) {
	// Close the connection when you're done with it.
	defer conn.Close()
	for {
		// Make a buffer to hold incoming data.
		buf := make([]byte, 1024)
		// Read the incoming connection into the buffer.
		total, err := conn.Read(buf)

		if err != nil {
			if err == io.EOF {
				log.Info("Connection EOF")
				return
			}
			log.Error("reading error, ", err)
			break
		} else {
			name := string(buf[1:total])

			if buf[0] == 43 {
				// '+' == 43
				arr := logSubDict[name]
				if arr == nil {
					arr = make([]net.Conn, 0, 10)
				}
				arr = append(arr, conn)
				logSubDict[name] = arr
			} else if buf[0] == 45 {
				// '-' == 43
			}

		}
	}
}

func UDPRead(conn *net.UDPConn) {
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

	go transport.WriteFile(filePath, buf)
}
