// server.go
package main

import (
	"./transport"
	"bytes"
	"flag"
	log "github.com/Sirupsen/logrus"
	. "github.com/tj/go-debug"
	"io"
	"net"
	"os"
	"path"
)

var host = flag.String("host", "0.0.0.0", "host")
var port = flag.String("port", "7001", "port")
var logPath = flag.String("logPath", "/data/logs", "logPath")
var archivePath = flag.String("archivePath", "/data/logs", "archivePath")
var logTagDict = make(map[string]int)
var debug = Debug("timtam-receiver")

// sub tcp connections
var subConnDict = make(map[string][]*net.TCPConn)

func main() {
	flag.Parse()
	go startTCPServer()
	startUDPServer()
}

/**
 * startUDPServer 启动UDP，用于获取日志
 * @return {[type]} [description]
 */
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
	log.Info("start udp log server, addr:", addr)
	for {
		udpRead(conn)
	}
}

/**
 * startTCPServer 启动TCP服务，用于pub log
 * @return {[type]} [description]
 */
func startTCPServer() {
	addr, err := net.ResolveTCPAddr("tcp", *host+":"+*port)
	if err != nil {
		log.Error("Can't resolve tcp address, ", err)
		os.Exit(1)
	}
	listener, err := net.ListenTCP("tcp", addr)
	if err != nil {
		log.Error("tcp listening, ", err)
		os.Exit(1)
	}
	defer listener.Close()
	log.Info("start tcp log server, addr:", addr)
	for {
		//wait for client
		conn, err := listener.AcceptTCP()
		if err != nil {
			log.Error("connection error, ", err)
		}
		sendLogTags(conn)
		go tcpRead(conn)
	}
}

func tcpRead(conn *net.TCPConn) {
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
				removeSubConn("*", conn)
				return
			}
			log.Error("reading error, ", err)
			break
		} else {
			cmdList := bytes.Split(buf[:total], []byte("\r\n"))
			for _, cmd := range cmdList {
				if len(cmd) == 0 {
					continue
				}
				name := string(cmd[1:])
				log.Info(string(cmd))
				if cmd[0] == 43 {
					// '+' == 43
					addSubConn(name, conn)
				} else if cmd[0] == 45 {
					// '-' == 43
					removeSubConn(name, conn)
				}
			}
		}
	}
}

/**
 * addSubConn 添加sub connection
 * @param {[type]} name string   [description]
 * @param {[type]} conn *net.TCPConn [description]
 */
func addSubConn(name string, conn *net.TCPConn) {
	arr := subConnDict[name]
	if arr == nil {
		arr = make([]*net.TCPConn, 0, 10)
	}
	arr = append(arr, conn)
	subConnDict[name] = arr
}

/**
 * removeSubConn 删除sub connection
 * @param  {[type]} name string        [description]
 * @param  {[type]} conn *net.TCPConn      [description]
 * @return {[type]}      [description]
 */
func removeSubConn(name string, conn *net.TCPConn) {
	if name == "*" {
		for n := range subConnDict {
			removeSubConn(n, conn)
		}
		return
	}
	arr := subConnDict[name]
	index := -1
	for i, tmp := range arr {
		if tmp == conn {
			index = i
		}
	}
	if index != -1 {
		subConnDict[name] = append(arr[:index], arr[index+1:]...)
	}
}

func addTag(app string) {
	logTagDict[app]++
	if logTagDict[app] == 1 {
		for n := range subConnDict {
			for _, conn := range subConnDict[n] {
				sendLogTags(conn)
			}
		}
	}
}

func sendLogTags(conn *net.TCPConn) {
	tags := ""
	for key, _ := range logTagDict {
		tags += (key + ",")
	}
	if len(tags) != 0 {
		buf := []byte("LOG-TAGS\t" + tags)
		buf[len(buf)-1] = 0
		conn.Write(buf)
	}
}

/**
 * [udpRead description]
 * @param {[type]} conn *net.UDPConn [description]
 */
func udpRead(conn *net.UDPConn) {
	data := make([]byte, 1500)
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
	name := string(data[:index])
	addTag(name)

	filePath := path.Join(*logPath, name)
	fileArchivePath := path.Join(*archivePath, name)
	buf := data[index+1 : total]
	debug("name:%s, buf:%s", name, buf)
	for _, tcpConn := range subConnDict[name] {
		tcpConn.Write(data[:total+1])
	}

	go transport.WriteFile(filePath, fileArchivePath, buf)
}
