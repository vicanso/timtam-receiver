package log

import (
	"fmt"
	"os"
	"time"
)

type FileLog struct {
	file string
	fd   *os.File
}

var fileLogMap = map[string]FileLog{}
var emptyFileLog = FileLog{}

func WriteFile(filePath string, buf []byte) {
	tmp := getFileLog(filePath)
	if tmp == emptyFileLog {
		return
	}
	_, err := tmp.fd.Write(append(buf[:], '\n'))
	if err != nil {
		fmt.Printf("Write log to %s fail", filePath)
	}
}

func getFileLog(filePath string) FileLog {
	now := time.Now()
	date := now.Format("2006-01-02")
	file := filePath + "/" + date
	tmp := fileLogMap[filePath]
	if tmp == emptyFileLog {
		err := os.MkdirAll(filePath, 0777)
		if err != nil {
			fmt.Printf("Mkidr %s fail, err:%s\n", filePath, err)
			return emptyFileLog
		}
		fd, err := os.OpenFile(file, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
		if err != nil {
			fmt.Printf("Open %s fail, err:%s\n", file, err)
			return emptyFileLog
		}
		fileLogMap[filePath] = FileLog{file, fd}
	} else if tmp.file != file {
		err := tmp.fd.Close()
		if err != nil {
			fmt.Printf("Close % fail", tmp.file)
		}
		fd, err := os.OpenFile(file, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
		if err != nil {
			fmt.Printf("Open %s fail, err:%s\n", file, err)
			return emptyFileLog
		}
		fileLogMap[filePath] = FileLog{file, fd}
	}
	return fileLogMap[filePath]
}
