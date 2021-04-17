const net = require("net");



class Request {
    constructor(options) {
        this.method = options.method || "GET";
        this.host = options.host;
        this.port = options.port || 80;
        this.path = options.path || "/";
        this.body = options.body || {};
        this.headers = options.headers || {};
        if(!this.headers["Content-Type"]) {
            this.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        if(this.headers["Content-Type"] === "application/json"){
            this.bodyText = JSON.stringify(this.body);
        }else if(this.headers["Content-Type"] === "application/x-www-form-urlencoded") {
            console.log("this.body:", this.body);
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join("&")
        }

        console.log("bodyText:", this.bodyText);

        this.headers["Content-Length"] = this.bodyText.length;
    }

    send(connection) {
        return new Promise((resolve, reject) => {
            const parser = new ResponseParser();
            if(connection) {
                connection.write(this.toString());
            }else {
                connection = net.createConnection({
                    host: this.host,
                    port: this.port
                }, () => {

                    console.log("request send this:\n", this.toString());
                    connection.write(this.toString());
                })
            }

            connection.on("data", data => {
                console.log("data:\n",data.toString());
                parser.receive(data.toString());
                if(parser.isFinished) {
                    resolve(parser.response);
                    connection.end();
                }
            })

            connection.on("error", err => {
                reject(err)
                connection.end();
            })
            resolve();
        })
    }

    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join("\r\n")}\r
\r
${this.bodyText}`
    }
}

class ResponseParser {
    constructor() {
        this.WAITING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1;
        this.WAITING_HEADER_NAME = 2;
        this.WAITING_HEADER_SPACE = 3;
        this.WAITING_HEADER_VALUE = 4;
        this.WAITING_HEADER_LINE_END = 5;
        this.WAITING_HEADER_BLOCK_END = 6;
        this.WAITING_BODY = 7;

        this.currentLine = this.WAITING_STATUS_LINE;
        this.statusLine = "";
        this.headers = {};
        this.headerName = "";
        this.headerValue = "";
        this.bodyPaeser = null;
    }

    get isFinished() {
        return this.bodyPaeser && this.bodyPaeser.isFinished;
    }

    get response() {
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/)
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyPaeser.content.join("")
        }
    }

    receive(string) {
        for(let i = 0; i < string.length; i++) {
            this.receiveChar(string.charAt(i));
        }
    }
    receiveChar(c) {
        if(this.currentLine === this.WAITING_STATUS_LINE) {
            if(c === "\r") {
                this.currentLine = this.WAITING_STATUS_LINE_END
            }else {
                this.statusLine += c;
            }
        }else if(this.currentLine === this.WAITING_STATUS_LINE_END) {
            if(c === "\n") {
                this.currentLine = this.WAITING_HEADER_NAME
            }
        }else if(this.currentLine === this.WAITING_HEADER_NAME) {
            if(c === ":") {
                this.currentLine = this.WAITING_HEADER_SPACE;
            }else if(c === "\r") {
                this.currentLine = this.WAITING_HEADER_BLOCK_END;
                if(this.headers['Transfer-Encoding'] === "chunked") {
                    this.bodyPaeser = new ThunkBodyParser();
                }
            }else {
                this.headerName += char;
            }
        }else if(this.currentLine === this.WAITING_HEADER_VALUE) {
            if(c === "\r") {
                this.currentLine = this.WAITING_HEADER_LINE_END;
                this.header[this.headerName] = this.headerValue
            }
        }
    }
}

void async function() {
    const request = new Request({
        method: "GET",
        host: "127.0.0.1",
        port: "8088",
        path: "/",
        headers: {
            ["X-foo2"]: "customed"
        },
        body: {
            name: "Cooper",
        }
    });

    const response = await request.send();

    console.log("response: ", response);
}()