$(document).ready(function() {
    const rows = 16;
    const cols = 20;
  
    function createMaze() {
      const $maze = $('#maze');
      $maze.empty();
  
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const isNormal = (row + col) % 2 === 0; // Alternate orientation
          const $triangle = $('<div>').addClass('triangle').addClass(isNormal ? 'normal' : 'inverted');
          
          // Example wall logic
          if (isNormal) {
            $triangle.append($('<div>').addClass('wall horizontal')); // Example top wall
            $triangle.append($('<div>').addClass('wall right')); // Example right wall
          } else {
            $triangle.append($('<div>').addClass('wall left')); // Example left wall
          }
          
          $maze.append($triangle);
        }
      }
    }
  
    createMaze();
  });
  