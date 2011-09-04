var http = require("http");
var jsdom = require("jsdom");
var RSS = require("rss");

console.log("starting msdownloads");

var feed = new RSS({
  title:"Microsoft Download Center",
  description:"The twenty latest downloads from the Microsoft Download Center. (For personal and non-commercial use only.)",
  feed_url:"http://www.microsoft.com/downloads"
});
var content = feed.xml(true);

function updateContent() {
  console.log("refreshing content...");

  jsdom.env("http://www.microsoft.com/download/en/search.aspx?q=t%2a&p=0&r=50&t=&s=availabledate~Descending", [
    'http://code.jquery.com/jquery.min.js'
  ],
  function(errors, window) {
    console.log("retrieved content");
    var items = window.$("td.descTD");
    console.log("got " + items.length + " items and " + errors.length + " errors");

    items.each(function(index, item) {
      feed.item({
       title:window.$("div.link a", item).text(),
       description:window.$("div.description", item).text(),
       url:"http://www.microsoft.com" + window.$("div.link a", item).attr("href") + "#tm"
      });
    });
    content = feed.xml(true);
    console.log("rss output updated");
  });
}

updateContent();
setInterval(updateContent, 60000 * 2);

http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type':'text/xml'});
  res.end(content);
}).listen(process.env.PORT || 8080);

