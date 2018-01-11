// server.go
package main

import (
	"bytes"
	"flag"
	"log"
	"net"
	"os"
	"path"

	"./transport"
	"github.com/visionmedia/go-debug"
)

var host = flag.String("host", "0.0.0.0", "host")
var port = flag.String("port", "7349", "port")

// 日志保存目录
var logPath = flag.String("logPath", "/logs", "logPath")

var debugLog = debug.Debug("timtam-receiver")

// {
// 	日志名称
// 	name : {
// 		日志存放目录
// 		logPath: string,
// 		当天日期 YYYY-MM-DD，用于生成日志文件名
// 		date: string,
// 		fd: *os.File
// 	}
// }
var fileTransportDict = make(map[string]*transport.File)

func main() {
	flag.Parse()
	startUDPServer()
}

/**
 * startUDPServer 启动UDP，用于获取日志
 * @return {[type]} [description]
 */
func startUDPServer() {
	addr, err := net.ResolveUDPAddr("udp", *host+":"+*port)
	if err != nil {
		log.Println("Can't resolve udp address, ", err)
		os.Exit(1)
	}
	conn, err := net.ListenUDP("udp", addr)
	if err != nil {
		log.Println("udp listening, ", err)
		os.Exit(1)
	}

	defer conn.Close()
	log.Println("start udp log server, addr:", addr)
	for {
		udpRead(conn)
	}
}

/**
 * udpRead 读取UDP数据并处理
 * @param {[type]} conn *net.UDPConn [description]
 */
func udpRead(conn *net.UDPConn) {
	data := make([]byte, 1500)
	total, _, err := conn.ReadFromUDP(data)
	if err != nil {
		log.Println("failed to read UDP message, ", err)
		return
	}

	// "\t" === 9
	index := bytes.IndexByte(data, 9)

	if index == -1 {
		return
	}
	name := string(data[:index])

	buf := data[index+1 : total]
	debugLog("name:%s, buf:%s", name, buf)

	fileTransport := fileTransportDict[name]
	if fileTransport == nil {
		fileTransport = &transport.File{}
		fileTransport.SetLogPath(path.Join(*logPath, name))
		fileTransportDict[name] = fileTransport
	}
	go fileTransport.Write(buf)
}
