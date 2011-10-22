var http = require("http");
var jsdom = require("jsdom");
var RSS = require("rss");
var express = require("express");

console.log("starting msdownloads");

var content;

function updateContent() {
  console.log("refreshing content...");

  var feed = new RSS({
    title:"Microsoft Download Center",
    description:"The twenty latest downloads from the Microsoft Download Center. (For personal and non-commercial use only.)",
    feed_url:"http://www.microsoft.com/downloads"
  });
  content = feed.xml(true);

  jsdom.env("http://www.microsoft.com/download/en/search.aspx?q=t%2a&p=0&r=50&t=&s=availabledate~Descending", [
    'http://code.jquery.com/jquery.min.js'
  ],
  function(errors, window) {
    if(errors) {
      console.log(errors);
    } else {    
      console.log("retrieved content");
      var $ = window.jQuery;

      $(function () {
	var items = $("td.descTD");
	console.log("got " + items.length + " items");

	items.each(function(index, item) {
	  feed.item({
	   title:$("div.link a", item).text(),
	   description:$("div.description", item).text(),
	   url:"http://www.microsoft.com" + $("div.link a", item).attr("href") + "#tm"
	  });
	});
	content = feed.xml(true);
	console.log("rss output updated");
      
	setTimeout(function() {window.close();}, 500);
      });
    }
  });
}

updateContent();
setInterval(updateContent, 60000 * 2);

var app = express.createServer(express.logger());

app.get("/", function(req, res) {
  res.contentType('text/xml');
  res.send(content);
}).listen(process.env.PORT || 8080);

