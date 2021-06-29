#!/usr/bin/env node

const ora = require("ora");
const chalk = require("chalk");
const got = require("got");
const cheerio = require("cheerio");

const s = ora("Initializing request...");
s.start();

const args = process.argv;

if (args[0].includes("node")) {
    var url = args.slice(2).join(" ");
} else {
    var url = args.slice(1).join(" ");
}

var b = "url=" + encodeURIComponent(url) + "&capture_all=on";
var i = encodeURI(b).split(/%..|./).length - 1;

s.text = "Requesting...";

got.post("https://web.archive.org/save/" + encodeURIComponent(url), {
    body: b,
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://web.archive.org/save",
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": i,
        "Origin": "https://web.archive.org",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Sec-GPC": "1",
        "TE": "trailers"
    }
}).then(function(resp) {
    if (resp.body.split('spn.watchJob("').length > 1) {
        var wj = resp.body.split('spn.watchJob("')[1].split('",')[0];
        if (wj) {
            got("https://web.archive.org/save/status/" + wj + "?_t=" + (new Date()).toString()).then(function(resp) {
                var j = JSON.parse(resp.body);
                if (j.status == "success") {
                    s.stop();
                    console.log(chalk.greenBright("✓") + " Someone archived this before you (less than 45 minutes ago).");
                    console.log("https://web.archive.org/" + j.timestamp + "/" + j.original_url);
                    process.exit();
                } else if (j.status == "pending") {
                    s.text = "Waiting for archival completion...";
                    var t = setInterval(function() {
                        got("https://web.archive.org/save/status/" + wj + "?_t=" + (new Date()).toString()).then(function(resp) {
                            var j = JSON.parse(resp.body);
                            if (j.status == "success") {
                                clearInterval(t);
                                s.stop();
                                console.log(chalk.greenBright("Archive completed!"));
                                console.log("https://web.archive.org/" + j.timestamp + "/" + j.original_url);
                                process.exit();
                            } else if (j.status !== "pending") {
                                console.log(j);
                            }
                        })
                    }, 6000)
                } else {
                    console.log(j);
                }
            })
        } else {
            s.color = "red";
            s.stop();
            console.log(chalk.red("✖ ") + "Failed to get job ID");
            console.log("This is probably because the Internet Archive changed their site. Please report this error to https://github.com/normanlol/archive-cli");
            process.exit(1);
        }
    } else {
        s.color = "red";
        s.stop();
        var $ = cheerio.load(resp.body);
        if ($(".col-md-offset-4 p")[0]) {
            var e = $(".col-md-offset-4 p").text()
        } else {
            var e = "Something went wrong that the program couldn't determine. Please report this to https://github.com/normanlol/archive-cli";
        }
        console.log(chalk.red("✖ ") + e);
        process.exit(1);
    }
}).catch(function(err) {
    s.color = "red";
    s.stop();
    console.log(chalk.redBright("✗"), err);
    process.exit(1);
})