package transport

import (
	"archive/zip"
	log "github.com/Sirupsen/logrus"
	. "github.com/tj/go-debug"
	"io"
	"os"
	"time"
)

type File struct {
	logPath     string
	archivePath string
	date        string
	fd          *os.File
}

var fileTransportMap = make(map[string]*File)
var debug = Debug("timtam-receiver")

func (self *File) Write(buf []byte) {
	now := time.Now()
	date := now.Format("2006-01-02")
	// 第一次写数据，先确保logPath已经生成
	if self.date == "" {
		err := os.MkdirAll(self.logPath, 0777)
		if err != nil {
			log.Error("mkdir fail:", err)
			return
		}
	}
	if self.date != date {
		// 当日期变化时，将前一天的日志归档 archive file
		err := self.zip()
		if err != nil {
			log.Error("archive fail:", err)
		}
		self.date = date
		self.fd = nil
	}
	if self.fd == nil {
		// 打开文件，用于写日志
		file := self.logPath + "/" + self.date
		fd, err := os.OpenFile(file, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
		if err != nil {
			log.Error("Open file fail:", err)
			return
		}
		self.fd = fd
		log.Info("Open file for log append success, file:", file)
	}
	self.fd.Write(append(buf, '\n'))
}

func (self *File) SetLogPath(logPath string) {
	self.logPath = logPath
}

func (self *File) SetArchivePath(archivePath string) {
	self.archivePath = archivePath
}

func (self *File) zip() (err error) {
	if self.date == "" {
		return
	}

	err = os.MkdirAll(self.archivePath, 0777)
	if err != nil {
		return
	}

	file := self.logPath + "/" + self.date
	archiveFile := self.archivePath + "/" + self.date + ".zip"

	go zipFile(file, archiveFile)
	return
}

func zipFile(src, dst string) {
	zipFile, err := os.Create(dst)
	if err != nil {
		log.Error("create archive fail:", err)
		return
	}
	defer zipFile.Close()

	archive := zip.NewWriter(zipFile)
	defer archive.Close()

	info, err := os.Stat(src)
	if err != nil {
		log.Error("stat src file fail:", err)
		return
	}

	header, err := zip.FileInfoHeader(info)
	if err != nil {
		log.Error("file info header fail:", err)
		return
	}
	header.Method = zip.Deflate

	writer, err := archive.CreateHeader(header)
	if err != nil {
		log.Error("create header fail:", err)
		return
	}

	reader, err := os.Open(src)
	if err != nil {
		log.Error("open file fail:", err)
		return
	}
	defer reader.Close()

	_, err = io.Copy(writer, reader)
	if err != nil {
		log.Error("copy file fail:", err)
		return
	}
	log.Info("archive " + src + " to " + dst + " success")
}
