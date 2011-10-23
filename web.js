var http = require("http");
var jsdom = require("jsdom");
var jstoxml = require("jstoxml");
var express = require("express");

console.log("starting msdownloads");

var poweredBy = '<?xml version="1.0"?><!--\n\n **** Powered by nodejs on Heroku ;-) **** \n\n-->';
var content;

function encode(s) {
  return s.replace(/&/g, '&amp;')
	  .replace(/</g, '&lt;')
	  .replace(/>/g, '&gt;');
}

function updateContent() {
  console.log("refreshing content...");

  var feed = {
    _name: 'rss',
    _attrs: {
       version: '2.0'
    },
    _content: {
      channel : [
	{title: "Microsoft Download Center"},
	{link: "http://www.microsoft.com/downloads/"},
	{description: "The fifty latest downloads from the Microsoft Download Center. (For personal and non-commercial use only.)"},
	{lastBuildDate: function() {return (new Date()).toGMTString(); }}
      ]	
    }
  };  
  
  if(!content) content = poweredBy + jstoxml.toXML(feed, false, '');

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
	  feed._content.channel.push({
	    item: {
	      title:encode($("div.link a", item).text()),
	      link:"http://www.microsoft.com" + $("div.link a", item).attr("href") + "#tm",
	      description:encode($("div.description", item).text())
	    }
	  });
	});
	content = poweredBy + jstoxml.toXML(feed, false, '');
	console.log("rss output updated");
      
	setTimeout(function() {window.close();}, 500);
      });
    }
  });
}

// Heroku appears to require a delay before we make a 
// net connection
setTimeout(updateContent, 5000);
setInterval(updateContent, 60000 * 5);

var app = express.createServer(express.logger());

app.get("/", function(req, res) {
  res.contentType('text/xml');
  res.send(content);
}).listen(process.env.PORT || 8080);

