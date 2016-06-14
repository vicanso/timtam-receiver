// server.go
package main

import (
	"./transport"
	"bytes"
	"flag"
	log "github.com/Sirupsen/logrus"
	. "github.com/tj/go-debug"
	"net"
	"os"
	"path"
	"strconv"
	"sync"
	"time"
)

type LogInfo struct {
	createdAt int64
	count     int
}

var host = flag.String("host", "0.0.0.0", "host")
var port = flag.String("port", "7349", "port")

// 日志保存目录
var logPath = flag.String("logPath", "/data/logs", "logPath")

// 日志归档目录
var archivePath = flag.String("archivePath", "/data/logs-archive", "archivePath")
var debug = Debug("timtam-receiver")

// 保存应用相关日志信息
// {
// 	日志名称
// 	name : {
// 		创建时间
// 		createdAt: int64,
// 		日志接收条数
// 		count: int
// 	}
// }
var logTagDict = make(map[string]*LogInfo)

// {
// 	日志名称
// 	name : {
// 		日志存放目录
// 		logPath: string,
// 		日志归档目录
// 		archivePath: string,
// 		当天日期 YYYY-MM-DD，用于生成日志文件名
// 		date: string,
// 		fd: *os.File
// 	}
// }
var fileTransportDict = make(map[string]*transport.File)

type SubConnection struct {
	// {
	// 	日志名称：sub该日志的tcp连接
	// 	name : []
	// }
	list map[string][]*net.TCPConn
	mu   *sync.RWMutex
}

var subConnection = SubConnection{make(map[string][]*net.TCPConn), new(sync.RWMutex)}

type TCPConnection struct {
	// 保存连接的sub tcp connections
	list []*net.TCPConn
	mu   *sync.RWMutex
}

var tcpConnection = TCPConnection{make([]*net.TCPConn, 0, 10), new(sync.RWMutex)}

// var tcpConnArr = make([]*net.TCPConn, 0, 10)

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
		log.Info("new tcp connection")
		sendLogTags(conn)
		tcpConnection.mu.Lock()
		tcpConnection.list = append(tcpConnection.list, conn)
		tcpConnection.mu.Unlock()
		go tcpRead(conn)
	}
}

/**
 * tcpRead TCP数据读取处理
 * @param  {[type]} conn *net.TCPConn  [description]
 * @return {[type]}      [description]
 */
func tcpRead(conn *net.TCPConn) {
	// Close the connection when you're done with it.
	defer conn.Close()
	for {
		// Make a buffer to hold incoming data.
		buf := make([]byte, 1024)
		// Read the incoming connection into the buffer.
		total, err := conn.Read(buf)

		if err != nil {
			removeTcpConn(conn)
			log.Error("tcp connection error:", err)
			return
		}
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

/**
 * addSubConn 添加sub connection
 * @param {[type]} name string   [description]
 * @param {[type]} conn *net.TCPConn [description]
 */
func addSubConn(name string, conn *net.TCPConn) {
	subConnection.mu.Lock()
	list := subConnection.list
	arr := list[name]
	if arr == nil {
		arr = make([]*net.TCPConn, 0, 10)
	}
	arr = append(arr, conn)
	list[name] = arr
	subConnection.mu.Unlock()
}

/**
 * removeSubConn 删除sub connection
 * @param  {[type]} name string        [description]
 * @param  {[type]} conn *net.TCPConn      [description]
 * @return {[type]}      [description]
 */
func removeSubConn(name string, conn *net.TCPConn) {
	if name == "*" {
		for n := range subConnection.list {
			removeSubConn(n, conn)
		}
		return
	}
	subConnection.mu.Lock()
	list := subConnection.list
	arr := list[name]
	index := -1
	for i, tmp := range arr {
		if tmp == conn {
			index = i
		}
	}
	if index != -1 {
		list[name] = append(arr[:index], arr[index+1:]...)
	}
	subConnection.mu.Unlock()
}

func removeTcpConn(conn *net.TCPConn) {

	// 从tcpConnArr中删除connection
	tcpConnection.mu.Lock()
	list := tcpConnection.list
	index := -1
	for i, tmp := range list {
		if tmp == conn {
			index = i
		}
	}
	if index != -1 {
		tcpConnection.list = append(list[:index], list[index+1:]...)
	}
	tcpConnection.mu.Unlock()
	removeSubConn("*", conn)
}

/**
 * addTag 记录发送过来日志的tag及日志接收条数
 * @param {[type]} app string [description]
 */
func addTag(app string) {
	info := logTagDict[app]
	if info == nil {
		info = &LogInfo{time.Now().Unix(), 0}
		logTagDict[app] = info
	}
	if info.count == 0 {
		log.Info("new log tag:" + app)
		for _, conn := range tcpConnection.list {
			sendLogTags(conn)
		}
	}
	info.count++
}

/**
 * sendLogTags 通过TCP发送日志tag相关信息
 * @param  {[type]} conn *net.TCPConn  [description]
 * @return {[type]}      [description]
 */
func sendLogTags(conn *net.TCPConn) {
	tags := ""
	for key, info := range logTagDict {
		tags += (key + "|" + strconv.FormatInt(info.createdAt, 10) + "|" + strconv.Itoa(info.count) + ",")
	}
	buf := []byte("LOG-TAGS\t" + tags)
	buf[len(buf)-1] = 0
	conn.Write(buf)
}

/**
 * udpRead 读取UDP数据并处理
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

	buf := data[index+1 : total]
	debug("name:%s, buf:%s", name, buf)
	for _, tcpConn := range subConnection.list[name] {
		tcpConn.Write(data[:total+1])
	}

	fileTransport := fileTransportDict[name]
	if fileTransport == nil {
		fileTransport = new(transport.File)
		fileTransport.SetLogPath(path.Join(*logPath, name))
		fileTransport.SetArchivePath(path.Join(*archivePath, name))
		fileTransportDict[name] = fileTransport
	}
	go fileTransport.Write(buf)
}
