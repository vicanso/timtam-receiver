package transport

import (
	"archive/zip"
	log "github.com/Sirupsen/logrus"
	. "github.com/tj/go-debug"
	"io"
	"os"
	"time"
)

type FileTransport struct {
	file        string
	archiveFile string
	fd          *os.File
}

var fileTransportMap = make(map[string]*FileTransport)
var debug = Debug("timtam-receiver")

func WriteFile(filePath string, archivePath string, buf []byte) {
	tmp := getFileLog(filePath, archivePath)
	if tmp == nil {
		return
	}
	_, err := tmp.fd.Write(append(buf[:], '\n'))
	if err != nil {
		log.Error("Write log fail, file:", filePath)
	}
}

func getFileLog(filePath string, archivePath string) *FileTransport {
	now := time.Now()
	date := now.Format("2006-01-02")
	file := filePath + "/" + date
	archiveFile := archivePath + "/" + date + ".zip"
	debug("file:%s, archiveFile:%s", file, archiveFile)
	tmp := fileTransportMap[filePath]
	needOpenFile := false
	if tmp == nil {
		err := os.MkdirAll(filePath, 0777)
		if err != nil {
			log.Error("mkdir fail:", err)
			return nil
		}
		if filePath != archivePath {
			err := os.MkdirAll(archivePath, 0777)
			if err != nil {
				log.Error("mkdir fail:", err)
				return nil
			}
		}
		needOpenFile = true
	} else if tmp.file != file {
		err := tmp.fd.Close()
		if err != nil {
			log.Error("Close file fail:", err)
		}

		err = zipFile(tmp.file, tmp.archiveFile)
		if err != nil {
			log.Error("archive file fail:", err)
		} else {
			log.Info("archive file success")
		}

		needOpenFile = true
	}

	if needOpenFile {
		fd, err := os.OpenFile(file, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0666)
		if err != nil {
			log.Error("Open file fail:", err)
			return nil
		}
		log.Info("Open file for log append success, file:", file)
		fileTransportMap[filePath] = &FileTransport{file, archiveFile, fd}
	}
	return fileTransportMap[filePath]
}

func zipFile(src, dst string) error {
	zipFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	archive := zip.NewWriter(zipFile)
	defer archive.Close()

	info, err := os.Stat(src)
	if err != nil {
		return err
	}

	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return err
	}
	header.Method = zip.Deflate

	writer, err := archive.CreateHeader(header)
	if err != nil {
		return err
	}

	reader, err := os.Open(src)
	if err != nil {
		return err
	}
	defer reader.Close()

	_, err = io.Copy(writer, reader)
	return err
}
