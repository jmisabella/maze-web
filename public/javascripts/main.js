
let VISITED_CELL_COLOR = "#b7ffb7";
let SOLVED_CELL_COLOR = "#b7ffb7";
let START_CELL_COLOR = "#00ffff";
let GOAL_CELL_COLOR = "#98ff98";
let UNVISITED_CELL_COLOR = "#808080";


var webSocket;
var interval = 10;
var stepIntervalEvent = null;
var mazeCellByScreenCoordsDict = {};
var displayNavigation = false;

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

function getDistanceFromClass(classes) {
  var distance = null;
  (jQuery.map(classes, function(c) {
    if (c.toString().includes("distance-")) {
      distance = parseInt(c.toString().replace("distance-", ""), 10);
    }
  }));
  return distance;
}

function sortByDistance(a, b){
  let aClasses = $(a).attr("class").split(/\s+/);
  let bClasses = $(b).attr("class").split(/\s+/);
  var aDist = getDistanceFromClass(aClasses);
  var bDist = getDistanceFromClass(bClasses);
  return ((aDist < bDist) ? -1 : ((aDist > bDist) ? 1 : 0));
}

function reverseSortByDistance(a, b){
  let aClasses = $(a).attr("class").split(/\s+/);
  let bClasses = $(b).attr("class").split(/\s+/);
  var aDist = getDistanceFromClass(aClasses);
  var bDist = getDistanceFromClass(bClasses);
  return ((bDist < aDist) ? -1 : ((bDist > aDist) ? 1 : 0));
}

function isCoords(coords) {
  return coords != null && coords.split(",").length == 2;
}
function xCoord(coords) {
  return isCoords(coords) ? head(coords.split(",")) : null;
}
function yCoord(coords) {
  return isCoords(coords) ? head(tail(coords.split(","))) : null;
}

$('input[type="radio"]').keydown(function(e) {
  // this is so users using arrow keys for navigation won't cause radio buttons to change value
  var arrowKeys = [37, 38, 39, 40];
  if (arrowKeys.indexOf(e.which) !== -1)
  {
    $(this).blur();
    return false;
  }
});

//////////////
$(document).ready(function() {

  // this is so client's session will reload so user won't need to refresh screen
  window.addEventListener("load", init, false);

  const mazeDiv = document.getElementById("maze");
  if (webSocket == null) {
    init();
  }
  $(".menu-button").click(function() {
    $(".menu-bar").toggleClass( "open" );
  });

  function defaultWidth() {
    let padding = 30;
    let cellSize = parseInt($('input[name="cell-size"]:checked').val(), 10);
    let max = parseInt(($(window).width() - padding) / cellSize, 10);
    $("#width").val(max);
    $("#start-y").val(0); // default start to be on the western wall
    $("#goal-y").val((this.value - 1).toString()); // default goal to be on the eastern wall
  }
  function defaultHeight() {
    let padding = 40;
    let cellSize = parseInt($('input[name="cell-size"]:checked').val(), 10);
    var max = parseInt(($(window).height() - padding) / cellSize, 10) - 6; // to allow space at bottom for navigation keys
    if (cellSize < 20) {
      max = max - 6; // adjusted for medium cell size
    }
    if (cellSize < 10) {
      max = max - 3; // adjusted for small cell size
    }
    $("#height").val(max);
  }

  function defaultStartAndGoal() {
    if (parseInt($("#width").val(), 10) >= parseInt($("#height").val(), 10)) {
      $("#start-y").val(0);
      $("#start-x").val(   parseInt((parseInt($("#height").val(), 10) - 1) / 2, 10)   );
      $("#goal-y").val(parseInt($("#width").val(), 10) - 1);
      $("#goal-x").val(   parseInt((parseInt($("#height").val(), 10) - 1) / 2)   );
    } else {
      $("#goal-x").val(0);
      $("#goal-y").val((parseInt(parseInt($("#height").val(), 10) - 1) / 2, 10));
      $("#start-x").val(parseInt($("#height").val(), 10) - 1);
      $("#start-y").val((parseInt(parseInt($("#height").val(), 10) - 1) / 2, 10));
    }
  }

  jQuery('#width').keyup(function () {
    if (this.value.length > 0) {
      let padding = 30;
      let cellSize = parseInt($('input[name="cell-size"]:checked').val(), 10);
      let arg = parseInt(this.value.replace(/[^0-9]/g,''), 10);
      let max = parseInt(($(window).width() - padding) / cellSize, 10);
      this.value = arg <= max ? arg : max;
      $("#start-y").val(0); // default start to be on the western wall
      $("#goal-y").val((this.value - 1).toString()); // default goal to be on the eastern wall
    }
  });
  jQuery('#height').keyup(function () { 
    if (this.value.length > 0) {
      let padding = 40;
      let cellSize = parseInt($('input[name="cell-size"]:checked').val(), 10);
      let arg = parseInt(this.value.replace(/[^0-9]/g,''), 10);
      var max = parseInt(($(window).height() - padding) / cellSize, 10) - 6; // to allow space at bottom for navigation keys
      if (cellSize < 20) {
        max = max - 6; // adjusted for medium cell size
      }
      if (cellSize < 10) {
        max = max - 3; // adjusted for small cell size
      }
      // let max = parseInt(($(window).height() - padding) / cellSize, 10) - 10; // to allow space at bottom for navigation keys
      this.value = arg <= max ? arg : max;
    }
  });
  jQuery('#start-y').keyup(function () {
      let current = parseInt(this.value, 10);
      let max = parseInt(parseInt($("#width").val(), 10) / 2, 10);
      this.value = current < max ? this.value : "0"; // default start on eastern wall of the maze
  });
  jQuery('#goal-y').keyup(function () {
      let current = parseInt(this.value, 10);
      let max = parseInt($("#width").val(), 10);
      let min = parseInt(max / 2, 10);
      this.value = current > min && current < max ? this.value : parseInt($("#width").val(), 10) - 1; // default goal cell on western wall of the maze
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



  // jQuery('#width').keyup(function () {
  //   if (this.value.length > 0) {
  //     let padding = 30;
  //     let cellSize = parseInt($('input[name="cell-size"]:checked').val(), 10);
  //     let arg = parseInt(this.value.replace(/[^0-9]/g,''), 10);
  //     let max = parseInt(($(window).width() - padding) / cellSize, 10);
  //     this.value = arg <= max ? arg : max;
  //     $("#start-y").val(0); // default start to be on the western wall
  //     $("#goal-y").val((this.value - 1).toString()); // default goal to be on the eastern wall
  //   }
  // });
  // jQuery('#start-y').keyup(function () {
  //     let current = parseInt(this.value, 10);
  //     let max = parseInt(parseInt($("#width").val(), 10) / 2, 10);
  //     this.value = current < max ? this.value : "0"; // default start on eastern wall of the maze
  // });
  // jQuery('#goal-y').keyup(function () {
  //     let current = parseInt(this.value, 10);
  //     let max = parseInt($("#width").val(), 10);
  //     let min = parseInt(max / 2, 10);
  //     this.value = current > min && current < max ? this.value : parseInt($("#width").val(), 10) - 1; // default goal cell on western wall of the maze
  // });
  // jQuery('#height').keyup(function () { 
  //   if (this.value.length > 0) {
  //     let padding = 40;
  //     let cellSize = parseInt($('input[name="cell-size"]:checked').val(), 10);
  //     let arg = parseInt(this.value.replace(/[^0-9]/g,''), 10);
  //     var max = parseInt(($(window).height() - padding) / cellSize, 10) - 6; // to allow space at bottom for navigation keys
  //     if (cellSize < 20) {
  //       max = max - 6; // adjusted for medium cell size
  //     }
  //     if (cellSize < 10) {
  //       max = max - 3; // adjusted for small cell size
  //     }
  //     // let max = parseInt(($(window).height() - padding) / cellSize, 10) - 10; // to allow space at bottom for navigation keys
  //     this.value = arg <= max ? arg : max;
  //   }
  // });
  // jQuery('#start-x').keyup(function () {
  //     let startX = this.value; 
  //     if (startX.length > 0 && parseInt(startX, 10) >= parseInt($("#height").val(), 10)) {
  //       this.value = parseInt($("#height").val(), 10) - 1;
  //     }
  // });
  // jQuery('#goal-x').keyup(function () {
  //     let goalX = this.value;
  //     if (goalX.length > 0 && parseInt(goalX, 10) >= parseInt($("#height").val(), 10)) {
  //       this.value = parseInt($("#height").val(), 10) - 1;
  //     }
  // });

  $(document).on('keyup blur input propertychange', 'input[class="numbers"]', function(){$(this).val($(this).val().replace(/[^0-9]/g,''));});  


  function init() {
    var host = location.origin.replace(/^https/, 'wss').replace(/^http/, 'ws'); 
    webSocket = new WebSocket(`${host}/ws`); 
    webSocket.onopen = onOpen;
    webSocket.onclose = onClose;
    webSocket.onmessage = onMessage;
    webSocket.onerror = onError;
    document.body.addEventListener('touchstart', function() {}, false); // this is to make button:active work in Chrome on mobile devices
    if ($("#width").val() == "" && $("#height").val() == "" && $("#start-x").val() == "" && $("#start-y").val() == "" && $("#goal-x").val() == "" && $("#goal-y").val() == "") {
      // if all inputs are empty, means page has loaded for first time, so default all inputs based on screen size
      defaultWidth();
      defaultHeight();
      defaultStartAndGoal(); 
      // defaultStartX();
      // defaultStartY();
      // defaultGoalX();
      // defaultGoalY();
    }
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
    console.log("Received response, drawing the maze...");
    $("#hidden-maze").html(event.data); 
    drawMaze(event.data, mazeDiv);
    console.log("Finished drawing the maze.");
    if (!displayNavigation) {
      // initially buttons are hidden but when maze is drawn should be shown 
      $("#outer-navigation").toggle();
      displayNavigation = true;
    }
    $("#loading-modal").css('display', 'none'); 
  }
 
  $(window).resize(function() {
    // Whenever window size changes, we need to clear out width, height, start coords, and goal coords
    // so that they would be re-entered according to the new max width and height based on window size
    $("#width").val("");
    $("#height").val("");
    $("#start-x").val("");
    $("#start-y").val("");
    $("#goal-x").val("");
    $("#goal-y").val("");
    defaultWidth();
    defaultHeight();
    defaultStartAndGoal(); 
    // defaultStartX();
    // defaultStartY();
    // defaultGoalX();
    // defaultGoalY();
  });  
  $('input[type=radio][name=cell-size]').change(function() {
    // Whenever cell size changes, need to clear out width, height, start coords, and goal coords
    // so that they would be re-entered according to the new max width and height based on cell size
    $("#width").val("");
    $("#height").val("");
    $("#start-x").val("");
    $("#start-y").val("");
    $("#goal-x").val("");
    $("#goal-y").val("");
    defaultWidth();
    defaultHeight();
    defaultStartAndGoal(); 
    // defaultStartX();
    // defaultStartY();
    // defaultGoalX();
    // defaultGoalY();
  });
  $('input[type=checkbox]').change(function() {
    window.clearInterval(stepIntervalEvent); 
    stepIntervalEvent = window.setInterval(solutionSteps, interval);
    let solve = $('input[name="solved"]:checked').prop('checked') == true;
    if (!solve) {
      var solutionDivs = $('div').filter('.on-solution-path').sort(sortByDistance);
      solutionDivs.each(function () { // mark each cell as not visited
        // this.classList.remove("visited");  
        this.classList.remove("solved");  
      });
      $("#hidden-distance").html("distance-0"); // reset solution back to start cell
    }
    window.clearInterval(stepIntervalEvent); 
    stepIntervalEvent = window.setInterval(solutionSteps, interval);
  });
  $("#speed").on('change input', function() {
    interval = $(this).val();
  });
  $('input[type=radio][name=display-type]').change(function() {
    let displayType = $('input[name="display-type"]:checked').val();
    $('div', $('#maze')).each(function () {
      let div = this[0]; // first item is object, 2nd item is the index
      let classes = $(this).attr("class").split(/\s+/);
      var distance = null;
      (jQuery.map(classes, function(c) {
        if (c.toString().includes("distance-")) {
          distance = parseInt(c.toString().replace("distance-", ""), 10);
        }
      }));
      var heatColorClass = null;
      (jQuery.map(classes, function(c) {
        if (c.toString().includes("heat-color-class-")) {
          heatColorClass = c.toString().replace("heat-color-class-", "");
        }
      }));
      if (displayType == "DistanceMap") {
        this.classList.add(heatColorClass);
      } else {
        this.classList.remove(heatColorClass);
      }
    });
  });

  function randomInt(min, max) { // inclusive min and max
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  
  function getCoordFromClass(classes, xOrY) {
    // prefix is either x-coord- or y-coord-
    let coordClassPrefix = xOrY + "-coord-"
    var coord = null;
    (jQuery.map(classes, function(c) {
      if (c.toString().includes(coordClassPrefix)) {
        coord = parseInt(c.toString().replace(coordClassPrefix, ""), 10);
      }
    }));
    return coord;
  }
  function getNeighborsFromClass(classes) {
    var neighbors = [];
    (jQuery.map(classes, function(c) {
      if (c.toString().includes("neighbors-")) {
        neighbors = c.toString().replace("neighbors-", "").split("-");
      }
    }));
    return neighbors;
  }

  function manualMoveByElement(mazeCellDiv, toggleMove = true, moveByMousePosition = true, moveByDirection = false, undoMove = false ) {
    var movesHistory = $("#hidden-visited").html().split("|");
    if (movesHistory.length > 0) {
      let div = mazeCellDiv; //c; //.target; 
      var xCoord = getCoordFromClass(div.classList, "x");
      var yCoord = getCoordFromClass(div.classList, "y");
      // console.log("X COORDS: " + xCoord);
      // console.log("Y COORDS: " + yCoord);
      let coords = xCoord + "," + yCoord;
      let neighbors = getNeighborsFromClass(div.classList);
      let visited = div.classList.contains("visited");
      let north = Array.from(neighbors).includes("north") && yCoord > 0 ? xCoord.toString() + "," + (yCoord - 1).toString() : null;
      let south = Array.from(neighbors).includes("south") && yCoord < parseInt($("#height").val(), 10) ? xCoord.toString() + "," + (yCoord + 1).toString() : null;
      let west = Array.from(neighbors).includes("west") && xCoord > 0 ? (xCoord - 1).toString() + "," + yCoord.toString() : null;
      let east = Array.from(neighbors).includes("east") && xCoord < parseInt($("#width").val(), 10) ? (xCoord + 1).toString() + "," + yCoord.toString() : null;
      console.log(neighbors);
      let remainingHistory = movesHistory.length > 1 ? tail(movesHistory).join("|") : "";
      let previousMove = movesHistory.length > 0 ? head(movesHistory) : "";
      console.log("CURRENT CELL: " + coords);
      // console.log("PREVIOUS MOVE: " + previousMove);
      // console.log("NORTH: " + north);
      // console.log("EAST: " + east);
      // console.log("SOUTH: " + south);
      // console.log("WEST: " + west);
      // console.log("NEIGHBORS CONTAINS WEST: " + Array.from(neighbors).includes("west"));
      // console.log("X-COORD IS GREATER THAN 0: " + (xCoord > 0).toString());
      // console.log("EXPECTED WEST COORDS: " + (xCoord - 1).toString() + "," + yCoord.toString());
      let isEligible = div.classList.contains("is-start") ||
        coords == previousMove ||
        (north != null && north == previousMove) || 
        (east != null && east == previousMove) || 
        (south != null && south == previousMove) || 
        (west != null && west == previousMove);
      console.log("IS ELIGIBLE: " + isEligible);
      if (isEligible) {
        if (undoMove || (visited && toggleMove)) {
          console.log("REMOVING VISITED");
          div.classList.remove("visited");
          if (previousMove == coords) {
            remainingHistory = movesHistory.length > 1 ? tail(movesHistory).join("|") : "";
            $("#hidden-visited").html(remainingHistory)
          } else {
            // ???
            // console.log("NO PREVIOUS MOVES");
          }
        } else {
          console.log("ADDING VISITED");
          div.classList.add("visited");
          $("#hidden-visited").html(coords + "|" + movesHistory.join("|"));
        }
        console.log("HISTORY: " + $("#hidden-visited").html());
      }
    }
  }

  function manualMoveByDirection(direction) {
    var movesHistory = $("#hidden-visited").html().split("|");
    var lastMoveDiv = null; 
    var lastMoveCoords = null; 
    if (movesHistory.length > 0 && head(movesHistory).length > 0) {
      lastMoveCoords = head(movesHistory);
      let x = head(lastMoveCoords.split(","));
      let y = head(tail(lastMoveCoords.split(",")));
      lastMoveCoords = x + "," + y;
      lastMoveDiv = $(".x-coord-" + x + ".y-coord-" + y)[0];
    }
    var coords = null;
    if (lastMoveCoords == null) {
      lastMoveDiv = $(".is-start")[0];
      let x = getCoordFromClass(lastMoveDiv.classList, "x");
      let y = getCoordFromClass(lastMoveDiv.classList, "y");
      lastMoveCoords = x + "," + y;
      lastMoveDiv.classList.add("visited");
      $("#hidden-visited").html(lastMoveCoords);
    }
    // previous x-coord
    var xCoord = parseInt(head(lastMoveCoords.split(",")), 10);
    // previous y-coord
    var yCoord = parseInt(head(tail(lastMoveCoords.split(","))), 10);
    let neighbors = getNeighborsFromClass(lastMoveDiv.classList);
    let north = Array.from(neighbors).includes("north") && yCoord > 0 ? xCoord.toString() + "," + (yCoord - 1).toString() : null;
    let south = Array.from(neighbors).includes("south") && yCoord < parseInt($("#height").val(), 10) ? xCoord.toString() + "," + (yCoord + 1).toString() : null;
    let west = Array.from(neighbors).includes("west") && xCoord > 0 ? (xCoord - 1).toString() + "," + yCoord.toString() : null;
    let east = Array.from(neighbors).includes("east") && xCoord < parseInt($("#width").val(), 10) ? (xCoord + 1).toString() + "," + yCoord.toString() : null;
    if (direction == "north") {
      coords = north;
    } else if (direction == "east") {
      coords = east;
    } else if (direction == "south") {
      coords = south;
    } else if (direction == "west") {
      coords = west;
    }
    if (coords != null) {
      var mazeCellDiv = $(".x-coord-" + head(coords.split(",")) + ".y-coord-" + head(tail(coords.split(","))))[0];
      if (mazeCellDiv.classList.contains("visited")) {
        console.log("~~~~~~~~~~~~~~~~~~~~~~ UNDO ~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        movesHistory = $("#hidden-visited").html().split("|");
        lastMoveCoords = head(movesHistory);
        console.log("LAST MOVE COORDS: " + lastMoveCoords);
        let x = head(lastMoveCoords.split(","));
        let y = head(tail(lastMoveCoords.split(",")));
        lastMoveCoords = x + "," + y;
        lastMoveDiv = $(".x-coord-" + x + ".y-coord-" + y)[0];
        let remainingHistory = tail(movesHistory).join("|");
        console.log("History: " + remainingHistory);
        $("#hidden-visited").html(remainingHistory);
        lastMoveDiv.classList.remove("visited");
      } else {
        manualMoveByElement(mazeCellDiv);
      }
    }
  }

  var elementCoords = function(element) {
    var bounds = element.getBoundingClientRect();
    return { x: parseInt(bounds.left, 10), y: parseInt(bounds.top, 10) }
  };
  var eventCoords = function( event ) {
    var bounds = event.target.getBoundingClientRect();
    return { x: parseInt(bounds.left, 10), y: parseInt(bounds.top, 10) }
  };

  $("#maze").bind("touchmove", function(e) {
    var coords = eventCoords(e);
    // alert("touch position: " + coords.x + "," + coords.y);
    console.log("touch position: " + coords.x + "," + coords.y);
    var mazeCellDivCoords = mazeCellByScreenCoordsDict[ coords.x.toString() + "," + coords.y.toString() ];
    // alert("maze cell div coords: " + mazeCellDivCoords);
    console.log("maze cell div coords: " + mazeCellDivCoords);
    // var mazeCellDivX = head(mazeCellDivCoords.split(","));
    // var mazeCellDivY = head((mazeCellDivCoords.split(",")));
    var mazeCellDivX = xCoord(mazeCellDivCoords);
    var mazeCellDivY = yCoord(mazeCellDivCoords);
    // alert("CELL X COORDS: " + mazeCellDivX);
    console.log("CELL X COORDS: " + mazeCellDivX);
    // alert("CELL Y COORDS: " + mazeCellDivY);
    console.log("CELL Y COORDS: " + mazeCellDivY);
    var mazeCellDiv = $(".x-coord-" + mazeCellDivX + ".y-coord-" + mazeCellDivY)[0];
    // alert("CELL DIV: " + mazeCellDiv.classList);
    console.log("CELL DIV: " + mazeCellDiv.classList);
    manualMoveByElement(mazeCellDiv, toggleMove = false);
  });

  // document.getElementById('maze').addEventListener("touchstart", function(event) {
  //   this.addEventListener("touchmove", function(e) {
  //     // If there's exactly one finger inside this element
  //     // if (event.targetTouches.length == 1) {
  //     //   // var touch = event.targetTouches[0];
  //     //   // console.log("touch position: " + touch.pageX + "," + touch.pageY);
  //     //   // var mazeCellDiv = mazeCellByScreenCoordsDict[ { x: touch.pageX, y: touch.pageY } ];
  //     //   // console.log("maze cell div id: " + mazeCellDiv);
  //       var coords = eventCoords(e);
  //       console.log("touch position: " + coords.x + "," + coords.y);
  //       var mazeCellDivCoords = mazeCellByScreenCoordsDict[ coords.x.toString() + "," + coords.y.toString() ];
  //       console.log("maze cell div coords: " + mazeCellDivCoords);
  //       var mazeCellDivX = head(mazeCetailllDivCoords.split(","));
  //       var mazeCellDivY = head((mazeCellDivCoords.split(",")));
  //       console.log("CELL X COORDS: " + mazeCellDivX);
  //       console.log("CELL Y COORDS: " + mazeCellDivY);
  //       var mazeCellDiv = $(".x-coord-" + mazeCellDivX + ".y-coord-" + mazeCellDivY)[0];
  //       console.log("CELL DIV: " + mazeCellDiv.classList);
  //       alert("CELL DIV: " + mazeCellDiv.classList);
  //       manualMoveByElement(mazeCellDiv, toggleMove = false);
  //     // }
  //   }, false);
  // }, false);

  // document.getElementById('maze').addEventListener("touchend", function(event) {
  //   var coords = eventCoords(event);
  //   console.log("touch position: " + coords.x + "," + coords.y);
  //   var mazeCellDivCoords = mazeCellByScreenCoordsDict[ coords.x.toString() + "," + coords.y.toString() ];
  //   console.log("maze cell div coords: " + mazeCellDivCoords);
  //   var mazeCellDivX = head(mazeCetailllDivCoords.split(","));
  //   var mazeCellDivY = head((mazeCellDivCoords.split(",")));
  //   console.log("CELL X COORDS: " + mazeCellDivX);
  //   console.log("CELL Y COORDS: " + mazeCellDivY);
  //   $(".x-coord-" + mazeCellDivX + ".y-coord-" + mazeCellDivY)[0].unbind("touchmove", function(e) { e.preventDefault() });
  // }, false);


  $("#maze").mousedown(function (e) {
    $(this).mousemove(function (e) {
      var coords = eventCoords(e);
      console.log("touch position: " + coords.x + "," + coords.y);
      var mazeCellDivCoords = mazeCellByScreenCoordsDict[ coords.x.toString() + "," + coords.y.toString() ];
      console.log("maze cell div coords: " + mazeCellDivCoords);
      var mazeCellDivX = xCoord(mazeCellDivCoords);
      var mazeCellDivY = yCoord(mazeCellDivCoords);
      console.log("CELL X COORDS: " + mazeCellDivX);
      console.log("CELL Y COORDS: " + mazeCellDivY);
      var mazeCellDiv = $(".x-coord-" + mazeCellDivX + ".y-coord-" + mazeCellDivY)[0];
      console.log("CELL DIV: " + mazeCellDiv.classList);
      manualMoveByElement(mazeCellDiv, toggleMove = false);
    }).mouseup(function () { 
      $(this).unbind("mousemove");
    });
  });

  function drawMaze(json, htmlParent) {
    if (json == null || json.toString() == "") {
      return "";
    }
    $("#maze").html(""); // clear
    let displayType = $('input[name="display-type"]:checked').val(); 
    let cellSize = parseInt($('input[name="cell-size"]:checked').val(), 10);
    var colorName = $("#hidden-color").html();  
    function getShades(color) {
      let suffixes = ["-50", "-100", "-200", "-300", "-400", "-500", "-600", "-700", "-800", "-900"]
      return $.map(suffixes.reverse(), function(suffix) { return color + suffix });
    }
    var colors = getShades(colorName);
    const BORDER_SIZE = 1;
    const BOX_WIDTH = cellSize;
    const BOX_HEIGHT = cellSize;
    const COLOR_SHADE_COUNT = colors.length;
    const EMPTY_WALL = BORDER_SIZE + "px solid transparent"; 
    const SOLID_WALL = BORDER_SIZE + "px solid black"; 
    let obj = JSON.parse(json.toString());
    htmlParent.style.width = (head(obj.body.rows).length * BOX_WIDTH) + "px";
    htmlParent.style.height = (obj.body.rows.length * BOX_HEIGHT) + "px";
    $('body,html').css("height", (htmlParent.style.height + 200) + "px");
    // BEGINNING of logic for creating distance heat map dictionary 
    let flattened = Array.prototype.concat.apply([], obj.body.rows);
    let distances = $.map(flattened, function(c) { return c.distance });
    let longestDist = Math.max.apply(Math, distances);
    let interval = (COLOR_SHADE_COUNT < longestDist) ? parseInt(longestDist / COLOR_SHADE_COUNT) : 1;
    var currColor = head(colors);
    colors = tail(colors);
    var distanceColorsDict = {};
    for (let i = 0; i <= longestDist; i++) {
      distanceColorsDict[i] = currColor;
      let changeColor = interval <= 1 ? true : i % interval == 0;
      if (changeColor) {
        currColor = head(colors);
        if (colors.length >= 2) {
          colors = tail(colors);
        } 
      } 
    }
    // END of logic for creating distance heat map dictionary
    mazeCellByScreenCoordsDict = {}; // clear global var maze cel by screen coords dictionary
    for (let i = 0; i < obj.body.rows.length; i++) {
      let row = obj.body.rows[i];
      for (let j = 0; j < row.length; j++) {
        var cell = row[j];
        var coords = cell.coords;
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
        box.style.borderTop = cell.linked.includes("north") ? EMPTY_WALL : SOLID_WALL;
        box.style.borderRight = cell.linked.includes("east") ? EMPTY_WALL : SOLID_WALL;
        box.style.borderBottom = cell.linked.includes("south") ? EMPTY_WALL : SOLID_WALL;
        box.style.borderLeft = cell.linked.includes("west") ? EMPTY_WALL : SOLID_WALL;
        box.classList.add("distance-" + cell.distance.toString());
        box.classList.add("heat-color-class-" + distanceColorsDict[cell.distance]);
        box.classList.add("x-coord-" + cell.coords.y.toString());
        box.classList.add("y-coord-" + cell.coords.x.toString());
        let neighborsClass = "neighbors-" + cell.linked.join("-");
        box.classList.add(neighborsClass);
        if (cell.onSolutionPath == true) {
          box.classList.add("on-solution-path");
        }
        if (cell.isStart) {
          box.classList.add("is-start");
        } else if (cell.isGoal) {
          box.classList.add("is-goal");
          $("#hidden-max-distance").html("distance-" + cell.distance.toString());
        }
        if (displayType == "DistanceMap") {
          box.classList.add(distanceColorsDict[cell.distance]);
        }
        //// add event listeners to the div box to allow user to draw/click through a path to manually solve the maze 
        // box.addEventListener("click", function(c) {
        //   manualMoveByElement(c.target,toggleMove = true);
        // });
        box.addEventListener("mousedown", function(c) {
          // manualMoveByElement(c.target, toggleMove = false);
          manualMoveByElement(c.target, togglemMove = true);
        });
        box.addEventListener("mouseend", function(c) {
          // manualMoveByElement(c.target, toggleMove = false);
          manualMoveByElement(c.target, togglemMove = true);
        });
        box.addEventListener("touchstart", function(c) {
          // manualMoveByElement(c.target, toggleMove = false);
          manualMoveByElement(c.target, toggleMove = true);
        });
        // box.addEventListener("touchmove", function(c) {
        //   manualMoveByElement(c.target, toggleMove = false);
        // });
        box.addEventListener("touchend", function(c) {
          manualMoveByElement(c.target, toggleMove = true);
          // manualMoveByElement(c.target, toggleMove = false);
        });
        htmlParent.appendChild(box);
        var screenCoords = elementCoords(box);
        var coordsStr = screenCoords.x.toString() + "," + screenCoords.y.toString()
        mazeCellByScreenCoordsDict[coordsStr] = cell.coords.y.toString() + "," + cell.coords.x.toString();
      }
    }
    $("#hidden-distance").html("distance-0"); // set solved distance from start cell at 0, where solution starts when being drawn
  }

  $(window).on("keydown", function(e) {
    var direction = null; 
    if (e.key == "ArrowUp") {
      direction = "north";
    } else if (e.key == "ArrowRight") {
      direction = "east";
    } else if (e.key == "ArrowDown") {
      direction = "south";
    } else if (e.key == "ArrowLeft") {
      direction = "west";
    }
    if (direction) {
      manualMoveByDirection(direction);
    }
  });

  $("#up-navigation").on("click" , function() {
    manualMoveByDirection("north");
  });
  $("#down-navigation").on("click" , function() {
    manualMoveByDirection("south");
  });
  $("#left-navigation").on("click" , function() {
    manualMoveByDirection("west");
  });
  $("#right-navigation").on("click" , function() {
    manualMoveByDirection("east");
  });


  function solutionSteps() {
    let solve = $('input[name="solved"]:checked').prop('checked') == true;
    if (solve) {
      let maxDistanceClass = $("#hidden-max-distance").html();
      let currentDistanceClass = $("#hidden-distance").html();
      if (maxDistanceClass != "" && currentDistanceClass != "" && maxDistanceClass != null && currentDistanceClass != null) {
        let maxDist = parseInt(maxDistanceClass.replace("distance-", ""), 10);
        let currDist = parseInt(currentDistanceClass.replace("distance-", ""), 10);
        let nextDist = currDist + 1;
        if (nextDist <= maxDist) {
          let div = head($('#maze div').filter('.on-solution-path.' + currentDistanceClass));
          // div.classList.add("visited");
          div.classList.add("solved");
          $("#hidden-distance").html("distance-" + nextDist.toString());
        }
      }
    }
    window.clearInterval(stepIntervalEvent); 
    stepIntervalEvent = window.setInterval(solutionSteps, interval);
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
    } else if (startX == goalX && startY == goalY) {
      alert("start and goal coordinates cannot match");
    } else {
      let colorNames = ["turquoise", "green-sea", "emerald", "nephritis", "peter-river", "belize-hole", "amethyst", "wisteria", "sunflower", "orange", "carrot", "pumpkin", "alizarin", "pomegranate"];
      let greyscaleNames = ["clouds", "silver", "concrete", "asbestos", "wet-asphalt", "midnight-blue"];
      let allColors = colorNames.concat(greyscaleNames);
      let previousColor = $("#hidden-color").html();
      let availableColors = previousColor == null || previousColor == "" ? allColors : jQuery.grep(allColors, function(c) { return c != previousColor });
      var nextColor = availableColors[randomInt(0, availableColors.length - 1)] // randomly choose one of the color lists
      $("#hidden-color").html(nextColor);
      $("#hidden-visited").html(""); 
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
      // $("#up-navigation").css("visibility: hidden");
      // $("#down-navigation").css("visibility: hidden");
      // $("#left-navigation").css("visibility: hidden");
      // $("#right-navigation").css("visibility: hidden");
      sendToServer(jsonMessage);
    }
  });

  // send the message when the user presses the <enter> key while in the textarea
  // $(window).on("keydown", function (e) {
  //     if (e.which == 13) {
  //         // getMessageAndSendToServer();
  //         return false;
  //     }
  // });

  // send the data to the server using the WebSocket
  function sendToServer(jsonMessage) {
    if(webSocket.readyState == WebSocket.OPEN) {
        consoleLog("SENT: " + jsonMessage.message);
        webSocket.send(JSON.stringify(jsonMessage));
        $("#loading-modal").css('display', 'block');
    } else {
        consoleLog("Could not send data. Websocket is not open.");
    }
  }

});