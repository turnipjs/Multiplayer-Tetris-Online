const http = require("http")
const fs = require("fs")

const host = "localhost"
const port = 8000

var server = http.createServer((request, response) => {
  console.log("requested: " + request.url);
  if (request.url = "/") {
    response.writeHead(200, {})
    response.end(fs.readFile("./public/index.html"));
  } else if (request.url = "/current-state/*") {
    response.end()
  } else {
    fs.readFile("./public" + request.url, (error, data) => {
      if (error) {
        console.log("error:404, sending 404.html")
        response.writeHead(404, {
          "content-type": "text/html"
        });
        response.end(fs.readFile("./public/error/404.html"));
      }
    });
  }
});

server.listen(port, host, () => {
  console.log("listening");
});
