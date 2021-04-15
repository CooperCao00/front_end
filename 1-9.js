// 1. 通过require("http")来引入http对象
const http = require("http");

// 2. 利用http自带方法createServer启动一个后台服务
http.createServer((req, res) => {
    let body = [];
    req.on("error", err => {
        console.log(err);
    }).on("data", chunk => {
        body.push(chunk.toString());
    }).on("end", () => {
        // Buffer类作为是处理二进制数据的缓冲区
        body = Buffer.concat(body).toString();
        console.log("body:", body);
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(" Hello world\n");
    })
// .listen(8088)让服务器监听localhost:8088端口
}).listen(8088)

console.log("server started");