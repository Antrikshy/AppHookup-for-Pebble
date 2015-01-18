var UI = require('ui');
var ajax = require('ajax');
var Vibe = require('ui/vibe');
var Settings = require('settings');

var redditResponse;
var ajaxResponseReceived = false;
var sort = Settings.data('sort');
if(sort === undefined){
  console.log('Local settings not found. Setting up...');
  Settings.data('sort', 'top');
  sort = 'top';
} 

var main = new UI.Card({
  title: "/r/AppHookup",
  subtitle: capitalize(sort)+" posts",
  body: "Press select to browse.\nPress up to toggle sort.\n\nShake to refresh."
});

function getPosts() {
  main.body("Press select to browse.\nPress up to toggle sort.\n\nLoading posts...");
  ajaxResponseReceived = false;
  redditResponse = null;
  
  ajax({ url: 'http://www.reddit.com/r/apphookup/'+sort+'.json?sort='+sort+'&limit=35', type: 'json' },
    function(data) {
      redditResponse = data;
      ajaxResponseReceived = true;
      
      console.log('Received data.');
      Vibe.vibrate('short');
      main.body("Press select to browse.\nPress up to toggle sort.\n\nShake to refresh.");
    },
    function(error) {
      console.log('Error receiving reddit data.');  
      main.body("Could not download posts.\nPress up to toggle sort.\n\nShake to try refreshing again.");
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
      title: capitalize(sort)+" posts",
      items: appsList
    }]
  });
  
  appMenu.show();
  
  appMenu.on('select', function(e) {
    var appDetails = new UI.Card({
      title: e.item.title,
      body: e.item.subtitle + '\n' + e.item.body,
      scrollable: true
    });
    
    appDetails.show();
  });
  
  appMenu.on('accelTap', function(e) {
    appMenu.hide();
    getPosts();
  });
});

main.on('click', 'up', function() {
  if(sort == 'new'){
    sort = 'top';
    Settings.data('sort', 'top');
  } else {
    sort = 'new';
    Settings.data('sort', 'new');
  }
  main.subtitle(capitalize(sort)+" posts");
  getPosts();
});

main.on('accelTap', function(e){
  console.log('Shake detected.');
  getPosts();
});

function parseApps(data) {
  var items = [];
  
  for (var i = 0; i < data.data.children.length; i++) {
    if (data.data.children[i].data.is_self) continue;
    
    var postTitle = data.data.children[i].data.title;
    postTitle = postTitle.replace("&amp;", "&");
    postTitle = postTitle.replace("&lt;", "<");
    postTitle = postTitle.replace("&gt;", ">");
    
    var titleArray = splitTitle(postTitle);
    
    var platform = titleArray[0];
    var appName = titleArray[1];
    var priceChange = titleArray[2];
    var description = titleArray[3];
    
    if (description === undefined)
      description = "";
    else   
      description = description + '\n\n';
      
    var user = data.data.children[i].data.author;
    
    items.push({
      title: appName,
      subtitle: platform,
      body: '/u/' + user + '\n' + priceChange + '\n\n' + description
    });
  }
  
  return items;
}

// Credit to Thanasis Grammatopoulos from Stack Overflow for this function
// http://stackoverflow.com/a/26446394/2005759
function splitTitle(title) {
  var titleRegex = new RegExp('(\\]\\s*\\[|\\s+\\[|\\]\\s+|\\[|\\])','g'); // Create reg exp (will be used 2 times)
  var titleArray = title.split(titleRegex); // Split array on every match
  
  for (var i = titleArray.length-1; i >= 0; i--) { // Remove useless array items
    // We are making a count down for because we remove items from the array
    if (titleArray[i].length === 0 || titleArray[i].match(titleRegex))
      titleArray.splice(i, 1);
  }
  
  return titleArray;
}

function capitalize(s)
{
    return s && s[0].toUpperCase() + s.slice(1);
}