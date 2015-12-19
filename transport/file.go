package transport

import (
	log "github.com/Sirupsen/logrus"
	"github.com/tj/go-debug"
	"os"
	"time"
)

type FileTransport struct {
	file string
	fd   *os.File
}

var fileTransportMap = map[string]FileTransport{}
var emptyFileTransport = FileTransport{}
var debugLog = debug.Debug("timtam-receiver")

func WriteFile(filePath string, buf []byte) {
	tmp := getFileLog(filePath)
	if tmp == emptyFileTransport {
		return
	}
	_, err := tmp.fd.Write(append(buf[:], '\n'))
	if err != nil {
		log.Error("Write log fail, file:", filePath)
	}
}

func getFileLog(filePath string) FileTransport {
	now := time.Now()
	date := now.Format("2006-01-02")
	file := filePath + "/" + date
	debugLog("file:%s", file)
	tmp := fileTransportMap[filePath]
	needOpenFile := false
	if tmp == emptyFileTransport {
		err := os.MkdirAll(filePath, 0777)
		if err != nil {
			log.Error("mkdir fail:", err)
			return emptyFileTransport
		}
		needOpenFile = true
	} else if tmp.file != file {
		err := tmp.fd.Close()
		if err != nil {
			log.Error("Close file fail:", err)
		}
		needOpenFile = true
	}

	if needOpenFile {
		fd, err := os.OpenFile(file, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
		if err != nil {
			log.Error("Open file fail:", err)
			return emptyFileTransport
		}
		log.Info("Open file fot log append success, file:", file)
		fileTransportMap[filePath] = FileTransport{file, fd}
	}
	return fileTransportMap[filePath]
}
