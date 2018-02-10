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
	m       sync.RWMutex
}

var fileTransportMap = make(map[string]*File)

func (ins *File) checkDate() {
	time.Sleep(60 * time.Second)
	ins.m.Lock()
	date := time.Now().Format("2006-01-02")
	if date != ins.date {
		ins.Close()
		ins.fd = nil
	} else {
		go ins.checkDate()
	}
	ins.m.Unlock()
}

// Write 写数据
func (ins *File) Write(buf []byte) {
	if ins.fd == nil {
		ins.m.Lock()
		defer ins.m.Unlock()
		if ins.fd == nil {
			err := os.MkdirAll(ins.logPath, 0777)
			if err != nil {
				log.Println("mkdir fail:", err)
				return
			}
			ins.date = time.Now().Format("2006-01-02")
			file := ins.logPath + "/" + ins.date
			fd, err := os.OpenFile(file, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
			if err != nil {
				log.Println("Open file fail:", err)
				return
			}
			ins.fd = fd
			log.Println("Open file for log append success, file:", file)
			go ins.checkDate()
		}
		ins.fd.Write(append(buf, '\n'))
	} else {
		ins.m.RLock()
		ins.fd.Write(append(buf, '\n'))
		ins.m.RUnlock()
	}
}

// SetLogPath 设置日志目录
func (ins *File) SetLogPath(logPath string) {
	ins.logPath = logPath
}

// Close 关闭写日志文件
func (ins *File) Close() error {
	if ins.fd != nil {
		return ins.fd.Close()
	}
	return nil
}
