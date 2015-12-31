GOOS=linux go build

docker build -t timtam-receiver .

rm ./timtam-receiver