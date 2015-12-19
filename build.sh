rm ./timtam-receiver

GOOS=linux go build

docker build .