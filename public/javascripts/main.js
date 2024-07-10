
function head(lst) {
  return lst[0];
}

function tail(lst) {
  return lst.slice(1);
}

function concatenate(lst, delimiter) {
  var result = ''
  for (i = 0; i < lst.length; i++) {
    if (result.length > 0) {
      result += delimiter
    }
    result += lst[i];
  }
  return result;
}

function wait(ms){
  var start = new Date().getTime();
  var end = start;
  while(end < start + ms) {
    end = new Date().getTime();
  }
}

// get the nth index of pattern from given str string
function nthIndex(str, pat, n) {
  var length= str.length, i= -1;
  while(n-- && i++<length) {
      i= str.indexOf(pat, i);
      if (i < 0) break;
  }
  return i;
}

// Given string value and delimiter and optional number of skips, splits string into a 2-element array 
// containing the 2 values resulting from splitting once.
function splitOnce(str, delimiter, numberOfSkips = 0) {
  if (numberOfSkips <= 0) {
    var first = str.substring(0, str.indexOf(delimiter)) 
    var second = str.substring(str.indexOf(delimiter)) 
    return [first, second];
  } else {
    var index = nthIndex(str, delimiter, numberOfSkips + 1);
    var first = str.substring(0, index);
    var second = str.substring(index);
    return [first, second];
  }
}

function contains(lst, element) {
  for (var i = 0; i < lst.length; i++) {
    if (lst[i] == element) {
      return true;
    }
  }
  return false;
}



//////////////

$(document).ready(function() {
  const mazeDiv = document.getElementById("maze");
  
  if (webSocket == null) {
    init();
  }
 
  $(".menu-button").click(function() {
    $(".menu-bar").toggleClass( "open" );
  });

  jQuery('.numbers').keyup(function () { 
    this.value = this.value.replace(/[^0-9]/g,'');
  }); 
 
  $(document).on('keyup blur input propertychange', 'input[class="numbers"]', function(){$(this).val($(this).val().replace(/[^0-9]/g,''));});  

  var webSocket;
  // var messageInput;

  function init() {
      var host = location.origin.replace(/^https/, 'wss').replace(/^http/, 'ws'); 
      webSocket = new WebSocket(`${host}/ws`); 
      // webSocket = new WebSocket("ws://localhost:9000/ws");
      webSocket.onopen = onOpen;
      webSocket.onclose = onClose;
      webSocket.onmessage = onMessage;
      webSocket.onerror = onError;
      $("#message-input").focus();
  }

  function onOpen(event) {
      consoleLog("CONNECTED");
  }

  function onClose(event) {
      consoleLog("DISCONNECTED");
      init();
  }

  function onError(event) {
      consoleLog("ERROR: " + event.data);
      consoleLog("ERROR: " + JSON.stringify(event));
  }

  
  function onMessage(event) {
      mazeDiv.innerHTML = ""; 
      console.log(event.data);
      let receivedData = JSON.parse(event.data);
      console.log("New Data: ", receivedData);
      $("#hidden-maze").html(event.data); 
      drawMaze(event.data, mazeDiv);
  }
  
  $('input[type=radio][name=display-type]').change(function() {
    var mazz = document.getElementById("maze");
    var json = $("#hidden-maze").html();
    drawMaze(json, mazz);
  });

  function randomInt(min, max) { // inclusive min and max
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  
  function drawMaze(json, htmlParent) {
    // htmlParent.value = "";
    // htmlParent.html = "";
    // htmlParent.text = "";
    $("#maze").html(""); // clear
    var displayType = $('input[name="display-type"]:checked').val(); 
    const BORDER_SIZE = 1;
    const BOX_WIDTH = 10;
    const BOX_HEIGHT = 10;
    const COLOR_SHADE_COUNT = 10;
    const EMPTY_WALL = BORDER_SIZE + "px solid transparent"; 
    const SOLID_WALL = BORDER_SIZE + "px solid black"; 
    if (json == null || json.toString() == "") {
      return "";
    }
    let colorGradients = [
      ["turquoise-50", "turquoise-100", "turquoise-200", "turquoise-300", "turquoise-400", "turquoise-500", "turquoise-600", "turquoise-700", "turquoise-800", "turquoise-900"],
      ["green-sea-50", "green-sea-100", "green-sea-200", "green-sea-300", "green-sea-400", "green-sea-500", "green-sea-600", "green-sea-700", "green-sea-800", "green-sea-900"],
      ["emerald-50", "emerald-100", "emerald-200", "emerald-300", "emerald-400", "emerald-500", "emerald-600", "emerald-700", "emerald-800", "emerald-900"],
      ["nephritis-50", "nephritis-100", "nephritis-200", "nephritis-300", "nephritis-400", "nephritis-500", "nephritis-600", "nephritis-700", "nephritis-800", "nephritis-900"],
      ["peter-river-50", "peter-river-100", "peter-river-200", "peter-river-300", "peter-river-400", "peter-river-500", "peter-river-600", "peter-river-700", "peter-river-800", "peter-river-900"],
      ["belize-hole-50", "belize-hole-100", "belize-hole-200", "belize-hole-300", "belize-hole-400", "belize-hole-500", "belize-hole-600", "belize-hole-700", "belize-hole-800", "belize-hole-900"],
      ["amethyst-50", "amethyst-100", "amethyst-200", "amethyst-300", "amethyst-400", "amethyst-500", "amethyst-600", "amethyst-700", "amethyst-800", "amethyst-900"],
      ["wisteria-50", "wisteria-100", "wisteria-200", "wisteria-300", "wisteria-400", "wisteria-500", "wisteria-600", "wisteria-700", "wisteria-800", "wisteria-900"],
      ["sunflower-50", "sunflower-100", "sunflower-200", "sunflower-300", "sunflower-400", "sunflower-500", "sunflower-600", "sunflower-700", "sunflower-800", "sunflower-900"],
      ["orange-50", "orange-100", "orange-200", "orange-300", "orange-400", "orange-500", "orange-600", "orange-700", "orange-800", "orange-900"],
      ["carrot-50", "carrot-100", "carrot-200", "carrot-300", "carrot-400", "carrot-500", "carrot-600", "carrot-700", "carrot-800", "carrot-900"],
      ["pumpkin-50", "pumpkin-100", "pumpkin-200", "pumpkin-300", "pumpkin-400", "pumpkin-500", "pumpkin-600", "pumpkin-700", "pumpkin-800", "pumpkin-900"],
      ["alizarin-50", "alizarin-100", "alizarin-200", "alizarin-300", "alizarin-400", "alizarin-500", "alizarin-600", "alizarin-700", "alizarin-800", "alizarin-900"],
      ["pomegranate-50", "pomegranate-100", "pomegranate-200", "pomegranate-300", "pomegranate-400", "pomegranate-500", "pomegranate-600", "pomegranate-700", "pomegranate-800", "pomegranate-900"]
    ];
    let greyscaleGradients = [
      ["clouds-50", "clouds-100", "clouds-200", "clouds-300", "clouds-400", "clouds-500", "clouds-600", "clouds-700", "clouds-800", "clouds-900"],
      ["silver-50", "silver-100", "silver-200", "silver-300", "silver-400", "silver-500", "silver-600", "silver-700", "silver-800", "silver-900"],
      ["concrete-50", "concrete-100", "concrete-200", "concrete-300", "concrete-400", "concrete-500", "concrete-600", "concrete-700", "concrete-800", "concrete-900"],
      ["asbestos-50", "asbestos-100", "asbestos-200", "asbestos-300", "asbestos-400", "asbestos-500", "asbestos-600", "asbestos-700", "asbestos-800", "asbestos-900"],
      ["wet-asphalt-50", "wet-asphalt-100", "wet-asphalt-200", "wet-asphalt-300", "wet-asphalt-400", "wet-asphalt-500", "wet-asphalt-600", "wet-asphalt-700", "wet-asphalt-800", "wet-asphalt-900"],
      ["midnight-blue-50", "midnight-blue-100", "midnight-blue-200", "midnight-blue-300", "midnight-blue-400", "midnight-blue-500", "midnight-blue-600", "midnight-blue-700", "midnight-blue-800", "midnight-blue-900"]
    ];
    let obj = JSON.parse(json.toString());
    htmlParent.style.width = (head(obj.body.rows).length * BOX_WIDTH) + "px";
    htmlParent.style.height = (obj.body.rows.length * BOX_HEIGHT) + "px";
    $('body,html').css("height", (htmlParent.style.height + 200) + "px");
    let flattened = Array.prototype.concat.apply([], obj.body.rows);
    let distances = $.map(flattened, function(c) { return c.distance });
    let longestDist = Math.max.apply(Math, distances);
    // TODO: longestDist used to determine when to change colors for distance map
    //       it would be used for mod arithmetic
    for (let i = 0; i < obj.body.rows.length; i++) {
      let row = obj.body.rows[i];
      for (let j = 0; j < row.length; j++) {
        var cell = row[j];
        var coords = cell.coords;
        var neighbors = cell.neighbors;
        var linked = cell.linked;
        var value = cell.value;
        var visited = cell.visited;
        let box = document.createElement("div");
        box.style.position = 'absolute';
        box.style.top = (BOX_HEIGHT * i) + "px";
        box.style.left = (BOX_WIDTH * j) + "px";
        box.style.display = 'block';
        box.style.width = BOX_WIDTH + "px";
        box.style.height = BOX_HEIGHT + "px";
        box.style.borderTop = linked.includes("north") ? EMPTY_WALL : SOLID_WALL;
        box.style.borderRight = linked.includes("east") ? EMPTY_WALL : SOLID_WALL;
        box.style.borderBottom = linked.includes("south") ? EMPTY_WALL : SOLID_WALL;
        box.style.borderLeft = linked.includes("west") ? EMPTY_WALL : SOLID_WALL;
        if (displayType == "Solved" && cell.onSolutionPath == true) {
          box.style.backgroundColor = "#ffffd8";
        } else if (displayType == "DistanceMap") {
          // TODO: for now we're displaying actual distances,
          //       but eventually we'll change box's background color instead of displaying text
          let interval = parseInt(longestDist / COLOR_SHADE_COUNT);
          var dict = {};
          var colors = colorGradients[randomInt(0, 13)] // randomly choose one of the color lists
          var currColor = head(colors);
          colors = tail(colors); 
          for (let i = 0; i <= longestDist; i++) {
            let changeColor = i % interval == 0;
            if (changeColor) {
              currColor = head(colors);
              if (colors.length >= 2) {
                colors = tail(colors);
              } 
            } 
            dict[i] = currColor;
          }
          // box.style.backgroundColor = dict[cell.distance]; 
          box.className = dict[cell.distance]; 
          box.style.color = "#000";
          box.style.fontSize = "7px";
          box.append(cell.distance.toString());
        }
        htmlParent.appendChild(box);
        // alert("row " + i + ", column " + j + ", coords " + coords.x + ", " + coords.y);
      }
    }

    // let body = obj.body; 
  }

  function consoleLog(message) {
      console.log("New message: ", message);
  }

  window.addEventListener("load", init, false);

  $("#send-button").click(function (e) {
      var width = $("#width").val();
      var height = $("#height").val();
      var algorithm = $("#select-generator").val();
      if (width <= "0" && height <= "0") {
        alert("enter width and height");
      } else if (width <= "0") {
        alert("enter width");
      } else if (height <= "0") {
        alert("enter height");
      } else if (algorithm == "") {
        alert("select algorithm");
      } else {
        request = {
          "width": width,
          "height": height,
          "algorithm": algorithm,
          "startX": "0",
          "startY": (height - 1).toString(),
          "goalX": (width - 1).toString(),
          "goalY": "0",
          "mazeType": "Solved"
        };
      
        var messageInput = JSON.stringify(request);

        let jsonMessage = {
            message: messageInput
        };

        // send our json message to the server
        console.log("Sending ...");
        sendToServer(jsonMessage);
      }
  });

  // send the message when the user presses the <enter> key while in the textarea
  $(window).on("keydown", function (e) {
      if (e.which == 13) {
          // getMessageAndSendToServer();
          return false;
      }
  });

  // send the data to the server using the WebSocket
  function sendToServer(jsonMessage) {
      if(webSocket.readyState == WebSocket.OPEN) {
          consoleLog("SENT: " + jsonMessage.message);
          webSocket.send(JSON.stringify(jsonMessage));
      } else {
          consoleLog("Could not send data. Websocket is not open.");
      }
  }

});