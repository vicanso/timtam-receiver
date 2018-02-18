GOOS=linux go build -o timtam-receiver server.go

docker build -t vicanso/timtam-receiver .

rm ./timtam-receiver
