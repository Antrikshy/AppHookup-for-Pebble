// TODO: Replace all escaped characters
// TODO: Show price data

var UI = require('ui');
var ajax = require('ajax');
var Vibe = require('ui/vibe');

var redditResponse;
var ajaxResponseReceived = false;

var main = new UI.Card({
  title: "/r/AppHookup",
  body: "Press select to browse.\n\nShake to refresh."
});

function getPosts() {
  main.body("Press select to browse.\n\nLoading posts...");
  ajaxResponseReceived = false;
  redditResponse = null;
  
  ajax({ url: 'http://www.reddit.com/r/apphookup/new.json?sort=new&limit=35', type: 'json' },
    function(data) {
      redditResponse = data;
      ajaxResponseReceived = true;
      
      console.log('received data');
      Vibe.vibrate('short');
      main.body("Press select to browse.\n\nShake to refresh.");
    },
    function(error) {
      console.log('error receiving reddit data');  
      main.body("Could not download posts.\n\nShake to try refreshing again.");
    }
  );
}

main.show();
getPosts();
  
main.on('click', 'select', function(e) {
  if (!ajaxResponseReceived) return false;
    
  var appsList = parseApps(redditResponse);
  var appMenu = new UI.Menu({
    sections: [{
      title: "Newest posts",
      items: appsList
    }]
  });
  
  appMenu.show();
  
  appMenu.on('select', function(e) {
    var appDetails = new UI.Card({
      title: e.item.title,
      body: e.item.subtitle + '\n' + e.item.body,
    });

    if (e.item.title.length > 25 || e.item.body.length > 45)
      appDetails.scrollable(true);
    
    appDetails.show();
  });
  
  appMenu.on('accelTap', function(e) {
    appMenu.hide();
    getPosts();
  });
});

main.on('accelTap', function(e){
  console.log('shake');
  getPosts();
});

function parseApps(data) {
  var items = [];
  
  for (var i = 0; i < data.data.children.length; i++) {
    if (data.data.children[i].data.is_self) continue;
    
    var postTitle = data.data.children[i].data.title;
    postTitle = postTitle.replace("&amp;", "&");
    postTitle = postTitle.replace("&lt;", ">");
    
    var appName = findAppName(postTitle);
    if (appName === false) continue;
    
    var description = findAppDesc(postTitle);
    if (description === false) continue;
      
    var user = data.data.children[i].data.author;
    var platform = postTitle.substring(0, postTitle.indexOf(']') + 1);
    
    items.push({
      title: appName,
      subtitle: platform,
      body: '/u/' + user + '\n\n' + description
    });
  }
  
  return items;
}

function findAppName(title) {
  var appName;
  
  try {
    if (((title.match(/]/g) || []).length) >= 3)
      appName = title.match(/\[[^\]]+\]\s*\[*([^\]\[]+)\]*\s*\[[^\]]+\]\s*(\[*[^\]]+\]*)*/)[1].trim();
    else
      appName = title.match(/\[[^\]]+\]\s*\[*([^\]\[]+)\]*\s*\[[^\]]+\]\s*(\[*[^\]]+\]*)/)[1].trim();
  }
  
  catch (TypeError) {
    return false;
  }
  
  return appName;
}

function findAppDesc(title) {
  var titleArray;
  var appDesc = "";
  
  try {
    if (((title.match(/]/g) || []).length) >= 3)
      titleArray = title.match(/\[[^\]]+\]\s*\[*([^\]\[]+)\]*\s*\[[^\]]+\]\s*(\[*[^\]]+\]*)*/);
    else
      titleArray = title.match(/\[[^\]]+\]\s*\[*([^\]\[]+)\]*\s*\[[^\]]+\]\s*(\[*[^\]]+\]*)/);
    
    if (titleArray.length >= 3)
      appDesc = titleArray[2].trim();
  }
  
  catch (TypeError) {
    return appDesc;
  }

  return appDesc;
}
