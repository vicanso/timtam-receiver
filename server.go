// server.go
package main

import (
	"bytes"
	"flag"
	"log"
	"net"
	"os"
	"path"

	"github.com/oxtoacart/bpool"
	"github.com/vicanso/timtam-receiver/transport"
)

var host = flag.String("host", "0.0.0.0", "host")
var port = flag.String("port", "7349", "port")

// 日志保存目录
var logPath = flag.String("logPath", "/logs", "logPath")
var poolSize = flag.Uint("poolSize", 4096, "poolSize")
var pageSize = flag.Uint("pageSize", 1500, "pageSize")

var fileTransportDict = make(map[string]*transport.File)

var bytePool *bpool.BytePool
var requestCount uint32

func main() {
	flag.Parse()
	bytePool = bpool.NewBytePool(int(*pageSize), int(*poolSize))
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
	defer func() {
		for _, fileTransport := range fileTransportDict {
			fileTransport.Close()
		}
	}()
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
	data := bytePool.Get()
	total, _, err := conn.ReadFromUDP(data)
	if err != nil {
		log.Println("failed to read UDP message, ", err)
		bytePool.Put(data)
		return
	}

	// "\t" === 9
	index := bytes.IndexByte(data, 9)

	if index == -1 {
		bytePool.Put(data)
		return
	}
	name := string(data[:index])

	buf := data[index+1 : total]

	fileTransport := fileTransportDict[name]
	if fileTransport == nil {
		fileTransport = &transport.File{}
		fileTransport.SetLogPath(path.Join(*logPath, name))
		fileTransportDict[name] = fileTransport
	}
	go func() {
		fileTransport.Write(buf)
		bytePool.Put(data)
	}()
}
