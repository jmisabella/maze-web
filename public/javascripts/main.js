

let CELL_SIZE = 10

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

  jQuery('#width').keyup(function () {
    if (this.value.length > 0) {
      let padding = 30;
      let arg = parseInt(this.value.replace(/[^0-9]/g,''), 10);
      let max = parseInt(($(window).width() - padding) / CELL_SIZE, 10);
      this.value = arg <= max ? arg : max;
      $("#start-y").val(0); // default start to be on the western wall
      $("#goal-y").val((this.value - 1).toString()); // default goal to be on the eastern wall
    }
  });
  jQuery('#start-y').keyup(function () {
      let current = parseInt(this.value, 10);
      let max = parseInt(parseInt($("#width").val(), 10) / 2, 10);
      this.value = current < max ? this.value : "0"; // default start on eastern wall of the maze
  });
  jQuery('#goal-y').keyup(function () {
      // this.value = (parseInt($("#width").val(), 10) - 1).toString() ; // keep starting cell on eastern edge of the maze
      let current = parseInt(this.value, 10);
      let max = parseInt($("#width").val(), 10);
      let min = parseInt(max / 2, 10);
      this.value = current > min && current < max ? this.value : parseInt($("#width").val(), 10) - 1; // default goal cell on western wall of the maze
  });
  jQuery('#height').keyup(function () { 
    if (this.value.length > 0) {
      let padding = 40;
      let arg = parseInt(this.value.replace(/[^0-9]/g,''), 10);
      let max = parseInt(($(window).height() - padding) / CELL_SIZE, 10);
      this.value = arg <= max ? arg : max;
    }
  });
  jQuery('#start-x').keyup(function () {
      let startX = this.value; 
      if (startX.length > 0 && parseInt(startX, 10) >= parseInt($("#height").val(), 10)) {
        this.value = parseInt($("#height").val(), 10) - 1;
      }
  });
  jQuery('#goal-x').keyup(function () {
      let goalX = this.value;
      if (goalX.length > 0 && parseInt(goalX, 10) >= parseInt($("#height").val(), 10)) {
        this.value = parseInt($("#height").val(), 10) - 1;
      }
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
 
  $(window).resize(function() {
    $("#hidden-width").html($(window).width()); // New height
    $("#hidden-height").html($(window).height()); // New height
  });  

  $('input[type=radio][name=display-type]').change(function() {
    var mazz = document.getElementById("maze");
    var json = $("#hidden-maze").html();
    drawMaze(json, mazz);
  });

  function randomInt(min, max) { // inclusive min and max
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  
  function drawMaze(json, htmlParent) {
    $("#maze").html(""); // clear
    var displayType = $('input[name="display-type"]:checked').val(); 
    const BORDER_SIZE = 1;
    const BOX_WIDTH = CELL_SIZE;
    const BOX_HEIGHT = CELL_SIZE;
    const COLOR_SHADE_COUNT = 10;
    const EMPTY_WALL = BORDER_SIZE + "px solid transparent"; 
    const SOLID_WALL = BORDER_SIZE + "px solid black"; 
    if (json == null || json.toString() == "") {
      return "";
    }

    var colorName = $("#hidden-color").html();  
    function getShades(color) {
      let suffixes = ["-50", "-100", "-200", "-300", "-400", "-500", "-600", "-700", "-800", "-900"]
      return $.map(suffixes, function(suffix) { return color + suffix });
    }
    var colors = getShades(colorName);
    
    let obj = JSON.parse(json.toString());
    htmlParent.style.width = (head(obj.body.rows).length * BOX_WIDTH) + "px";
    htmlParent.style.height = (obj.body.rows.length * BOX_HEIGHT) + "px";
    $('body,html').css("height", (htmlParent.style.height + 200) + "px");
    // BEGINNING of logic for creating distance heat map dictionary 
    let flattened = Array.prototype.concat.apply([], obj.body.rows);
    let distances = $.map(flattened, function(c) { return c.distance });
    let longestDist = Math.max.apply(Math, distances);
    let interval = (COLOR_SHADE_COUNT < longestDist) ? parseInt(longestDist / COLOR_SHADE_COUNT) : 1;
    var dict = {};

    var currColor = head(colors);
    colors = tail(colors);
    for (let i = 0; i <= longestDist; i++) {
      dict[i] = currColor;
      let changeColor = interval <= 1 ? true : i % interval == 0;
      if (changeColor) {
        currColor = head(colors);
        if (colors.length >= 2) {
          colors = tail(colors);
        } 
      } 
    }
    // END of logic for creating distance heat map dictionary 
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
        if (displayType == "DistanceMap" || displayType == "Solved") {
          box.className = dict[cell.distance]; 
        }
        if (displayType == "Solved" && cell.onSolutionPath == true) {
          box.style.backgroundColor = "#ffffd8";
        }
        if (cell.isStart) {
          box.style.backgroundColor = "#fff";
        } else if (cell.isGoal) {
          box.style.backgroundColor = "#99fb99";
        }
        htmlParent.appendChild(box);
      }
    }

    // let body = obj.body; 
  }

  function consoleLog(message) {
      console.log("New message: ", message);
  }

  window.addEventListener("load", init, false);

  $("#send-button").click(function (e) {
      let width = $("#width").val();
      let height = $("#height").val();
      let algorithm = $("#select-generator").val();
      let startX = $("#start-x").val();
      let startY = $("#start-y").val();
      let goalX = $("#goal-x").val();
      let goalY = $("#goal-y").val();
      if (width <= "0" && height <= "0") {
        alert("enter width and height");
      } else if (width <= "0") {
        alert("enter width");
      } else if (height <= "0") {
        alert("enter height");
      } else if ((startX.length == 0 || startY.length) == 9 && (goalX.length == 0 || goalY.length == 0)) {
        alert("start and goal coordinates are required");
      } else if (startX.length == 0 || startY.length == 0) {
        alert("start coordinates are required");
      } else if (goalX.length == 0 || goalY.length == 0) {
        alert("goal coordinates are required");
      } else if (algorithm == "") {
        alert("select algorithm");
      } else {
        let colorNames = ["turquoise", "green-sea", "emerald", "nephritis", "peter-river", "belize-hole", "amethyst", "wisteria", "sunflower", "orange", "carrot", "pumpkin", "alizarin", "pomegranate"];
        let greyscaleNames = ["clouds", "silver", "concrete", "asbestos", "wet-asphalt", "midnight-blue"];
        let allColors = colorNames.concat(greyscaleNames);
        let previousColor = $("#hidden-color").html();
        let availableColors = previousColor == null || previousColor == "" ? allColors : jQuery.grep(allColors, function(c) { return c != previousColor });
        var nextColor = availableColors[randomInt(0, availableColors.length - 1)] // randomly choose one of the color lists
        $("#hidden-color").html(nextColor);
        request = {
          "width": width,
          "height": height,
          "algorithm": algorithm,
          "startX": startY, // bug in maze library, start coords are reversed
          "startY": startX, // bug in maze library, start coords are reversed
          "goalX": goalY, // bug in maze library, start coords are reversed
          "goalY": goalX, // bug in maze library, start coords are reversed
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