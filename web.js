var http = require("http");
var jsdom = require("jsdom");
var jstoxml = require("jstoxml");
var request = require('request');
var express = require("express");

console.log("starting msdownloads");

var poweredBy = '<?xml version="1.0"?><!--\n\n **** Powered by nodejs on Heroku ;-) **** \n\n-->';
var content, itemCount = 0;

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
	{lastBuildDate: (new Date()).toGMTString() }
      ]	
    }
  };  
  
  if(!content) content = poweredBy + jstoxml.toXML(feed, false, '');

  request({ uri:"http://www.microsoft.com/download/en/search.aspx?q=t%2a&p=0&r=50&t=&s=availabledate~Descending" }, function (error, response, body) {
    if (error && response.statusCode !== 200) {
      console.log('Error ' + error);
      return; 
    }
    
    if (response.headers["refresh"]) {
      console.log('Got a refresh header. Retrying');
      updateContent();
      return;
    }

    jsdom.env({
      html: body,
      scripts:[ 
	'http://code.jquery.com/jquery.min.js'
      ]},
      function(errors, window) {
	if(errors) {
	  console.log(errors);
	} else {    
	  console.log("retrieved content");
	  var $ = window.jQuery;

	  $(function () {
	    var items = $("td.descTD");
	    itemCount = items.length;
	    console.log("got " + itemCount + " items");

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
  });
}

updateContent(); 
setInterval(updateContent, 60000 * 5);

var app = express.createServer(express.logger());

app.get("/", function(req, res) {
//  if(req.headers["user-agent"].indexOf("FeedBurner") === -1) {
//    console.log("redirect client");
//    res.redirect("http://feeds.feedburner.com/MicrosoftDownloadCenter2", 307);
//    return;
//  }

  if(itemCount === 0) updateContent();

  res.contentType('text/xml');
  res.send(content);
}).listen(process.env.PORT || 8080);

