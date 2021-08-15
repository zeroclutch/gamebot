import { transformFileSync } from "@babel/core";

const options = {
    // ignore: ["./dist"]
}

let result = transformFileSync("server.js", options)
result.code;
console.log(result)