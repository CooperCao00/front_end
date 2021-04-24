// 1. 通过require("http")来引入http对象
const http = require("http");

// 2. 利用http自带方法createServer启动一个后台服务
http.createServer((req, res) => {
    let body = [];
    let body1 = [];
    req.on("error", err => {
        console.log(err);
    }).on("data", chunk => {

        console.log("chunk:\n", chunk);
        // body.push(chunk.toString());
        body.push(chunk);
        body1.push(chunk.toString())

        console.log("body pushed:", body);
    }).on("end", () => {

        console.log("end");
        // Buffer类作为是处理二进制数据的缓冲区
        body = Buffer.concat(body).toString();
        // body1 = Buffer.concat(body).toString();
        console.log("body:", body);
        // console.log("body1: ", body1);
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(
`<html maaa=a >
<head>
    <style>
body div #myid{
    width: 100px;
    background-color: #ff5000;
}
body div img {
    width: 30px;
    background-color: #ff1111;
}
</style>
</head>
<body>
    <div>
        <img id="myId">
        <img />
    <div>
</body>
</html>
`);
    })
// .listen(8088)让服务器监听localhost:8088端口
}).listen(8088)

console.log("server started");