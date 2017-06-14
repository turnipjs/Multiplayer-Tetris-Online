function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var nextTmino = tminoArray[getRandomIntInclusive(0, 6)];

function chooseNewTmino() {
  nextTmino = getRandomIntInclusive(0, 6)
}

var activeTmino = {
  type: chooseNewTmino(),
  orientation: 0,
  xCoord: 3,
  yCoord: 0
};

function init() {
  var stage = new createjs.Stage("board");
  var circle = new createjs.Shape();
  circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
  circle.x = 100;
  circle.y = 100;
  stage.addChild(circle);
  createjs.Ticker.setFPS(60);
  createjs.Ticker.addEventListener("tick", stage);
}

var currentLevel = 0;

function dropTminoOne() {
  // placeholder
}

function dropLoop() {
  var lvlarr = [60, 50, 45, 40, 37, 34, 30, 27, 23, 19, 15, 13, 10, 8, 6, 4, 3, 2, 1];
  var dropWaitTime = function() {
    if (currentLevel <= 18) {
      return lvlarr[currentLevel] / 60 * 1000;
    } else {
      return 17;
    }
  };
  dropPiece();
  setTimeout(dropWaitTime);
}
