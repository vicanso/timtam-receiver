package transport

import (
	"log"
	"os"
	"sync"
	"time"
)

// File 文件transport
type File struct {
	logPath string
	date    string
	fd      *os.File
	m       sync.Mutex
}

var fileTransportMap = make(map[string]*File)

// Write 写数据
func (ins *File) Write(buf []byte) {
	now := time.Now()
	date := now.Format("2006-01-02")
	ins.m.Lock()
	defer ins.m.Unlock()

	// 第一次写数据，先确保logPath已经生成
	if ins.date == "" {
		err := os.MkdirAll(ins.logPath, 0777)
		if err != nil {
			log.Println("mkdir fail:", err)
			return
		}
	}
	if ins.date != date {
		ins.date = date
		if ins.fd != nil {
			ins.fd.Close()
		}
		ins.fd = nil
	}
	if ins.fd == nil {
		// 打开文件，用于写日志
		file := ins.logPath + "/" + ins.date
		fd, err := os.OpenFile(file, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
		if err != nil {
			log.Println("Open file fail:", err)
			return
		}
		ins.fd = fd
		log.Println("Open file for log append success, file:", file)
	}
	ins.fd.Write(append(buf, '\n'))
}

// SetLogPath 设置日志目录
func (ins *File) SetLogPath(logPath string) {
	ins.logPath = logPath
}
