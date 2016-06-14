GOOS=linux go build

docker build -t vicanso/timtam-receiver:0.0.2 .

rm ./timtam-receiver