const blocks = {
  i: {
    grids: [
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0]
      ]
    ],
    style: "hollow",
    offsets: [0, 2]
  },
  j: {
    grids: [
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 1]
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 1, 1, 0]
      ],
      [
        [0, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 0],
        [0, 0, 1, 0]
      ]
    ],
    style: "dark",
    offsets: [1, 1, 1, 2]
  },
  l: {
    grids: [
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 0, 0]
      ],
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0]
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 1],
        [0, 1, 1, 1],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 1]
      ]
    ],
    style: "light",
    offsets: [1, 1, 1, 2]
  },
  o: {
    grids: [
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 1]
      ]
    ],
    style: "hollow",
    offsets: [2]
  },
  s: {
    grids: [
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 1, 1],
        [0, 1, 1, 0]
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 0, 1]
      ]
    ],
    style: "dark",
    offsets: [1, 2]
  },
  t: {
    grids: [
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 0, 1, 0]
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0]
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 0]
      ]
    ],
    style: "hollow",
    offsets: [1, 1, 1, 2]
  },
  z: {
    grids: [
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 1]
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 1],
        [0, 0, 1, 1],
        [0, 0, 1, 0]
      ]
    ],
    style: "light",
    offsets: [1, 2]
  }
};

var canvas;
var background;

function errorSolRefresh() {
  document.getElementsByTagName("body")[0].style = "display: none;";
  document.write("<p>Something Went Wrong! <a href='#' onclick='location.reload(true)'>Click Here</a> To Reload</p>")
}

function blocksToPix(numBlocks, addition) {
  addition = addition || 0;
  return numBlocks * 3 * 8 + addition;
}

function preload() {
  bg = loadImage("img/background.png");
}

function setup() {
  frameRate(60);
  createCanvas(1020, 540);
  canvas = document.getElementById("defaultCanvas0");
  background(bg);
  rect(5, 35, 280, 560); //play field
}

function draw() {

}
