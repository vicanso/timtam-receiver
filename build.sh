GOOS=linux go build

docker build -t vicanso/timtam-receiver .

rm ./timtam-receiver
