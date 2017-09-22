var sk = {
  field: {},
  controls: {}
};
var specialBlocks = {
  A: "ADD LINE",
  C: "CLEAR LINE",
  S: "SWITCH",
  G: "GRAVITY",
  E: "EARTHQUAKE",
  N: "NUKE",
  B: "CLEAR SPECIALS",
  O: "BOMB",
  R: "RANDOM CLEAR",
  D: "DARKNESS"
};
var stackSpec;
sk.App = function(f) {
  var a = {
    initLvl: 0,
    initTimeInterval: 1000,
    lvlDiff: 0.85,
    lvlDuration: 90000,
    minTimeInterval: 250
  };
  var d = 10,
    i = this;
  $.extend(a, f);
  var h = a.initLvl,
    g = a.initTimeInterval,
    e = a.lvlDiff,
    j = a.lvlDuration,
    k = a.minTimeInterval;
  this.GAME_WAITING = 0;
  this.GAME_STARTING = 1;
  this.GAME_STARTED = 2;
  $(".level-value").html(h);
  this.nextLvl = function() {
    g = Math.floor(g * e);
    g = g < k ? k : g;
    h++;
    $(".level-value").html(h);
    this.lvlCheckPoint = new Date().getTime()
  };
  this.lvlInterval = function() {
    return g
  };
  this.lvlDuration = function() {
    return j
  };
  this.resetLvl = function() {
    h = a.initLvl;
    g = a.initTimeInterval;
    h = a.initLvl;
    b = [];
    $(".level-value").html(h);
    $(".lines-value").html("0")
  };
  this.fieldPositionBuffer = null;
  this.updateStack = [];
  var b = [];
  this.stackSpecials = function(l, p) {
    var o, n = $(".stack-container .stack");
    p = p > 4 ? 4 : p;
    while (b.length < d && l.length > 0) {
      o = l.shift();
      if ((b.length + p) > d) {
        for (var m = 0, q = d - b.length; m < q; m++) {
          b.push(o);
          n.append('<div class="block">' + o + "</div>");
          n.css({
            left: "-=30"
          })
        }
      } else {
        for (var m = 0; m < p; m++) {
          b.push(o);
          (function(c) {
            n.append('<div class="block">' + c + "</div>");
            n.css({
              left: "-=30"
            })
          })(o)
        }
      }
    }
  };
  this.discardSpecial = function() {
    if (!b.length) {
      return
    }
    b.shift();
    var c = $(".stack-container .stack"),
      l = c.find(".block").filter(":first");
    c.css({
      left: "+=30"
    });
    l.remove()
  };
  this.activateSpecial = function(n) {
    var o, c;
    if (b.length < 1) {
      return
    }
    o = b.shift();
    if ((i.opponents[n] && i.opponents[n].isOver) || (n != user.id && !i.opponents[n])) {
      b.unshift(o);
      return
    }
    var l = $(".stack-container .stack"),
      m = l.find(".block").filter(":first");
    l.css({
      left: "+=30"
    });
    m.remove();
    if (o == "S" && n == user.id) {
      return
    }
    if (o == "S") {
      if (i.updateStack.length > 0) {
        sk.App.Comm.emit("fu", {
          id: user.id,
          s: i.updateStack
        });
        i.updateStack = []
      }
      i.stopListeners();
      i.stopInterval();
      i.stopFieldCheckInterval();
      i.fieldSwitching = true;
      c = i.field.getFieldData();
      sk.App.Comm.emit("ts", {
        id: user.id,
        field: c.field,
        pivot: c.pivot,
        shape: c.shape,
        t: n
      });
      i.field.showSwitching()
    } else {
      if (n == user.id) {
        i.field.applyAction(o);
        sk.App.Comm.emit("su", {
          f: user.id,
          t: user.id,
          b: o
        });
        ChatBox.userTo(user.firstName, user.firstName, specialBlocks[o])
      } else {
        if (i.opponents[n]) {
          sk.App.Comm.emit("ba", {
            id: user.id,
            b: o,
            f: user.id,
            t: n
          })
        }
      }
    }
  };
  this.status = this.GAME_WAITING;
  this.actionEffectsStack = [];
  this.isOver = true
};
sk.App.prototype.init = function() {
  var a = this,
    b = $(document);
  sk.App.Comm.init(this);
  ChatBox.input.focus();
  this.opponents = {};
  this.opponentsCount = 0;
  this.shapes = [];
  b.bind("playerready", function() {
    user.ready = true;
    sk.App.Comm.emit("playerready", {
      id: user.id
    });
    a.isOver = false;
    a.field.hideOverlay();
    a.reset()
  });
  b.bind("playernotready", function() {
    user.isPlayer = false;
    user.ready = false;
    a.hidePlayingField();
    sk.App.Comm.emit("notready", {
      id: user.id
    });
    ChatBox.msg(locales.youSitNWatch);
    a.checkAvailableSpot()
  });
  ChatBox.input.bind("focus", function() {
    if (user.isPlayer) {
      a.field.controls.stopListener()
    }
    a.stopAppListeners()
  });
  ChatBox.input.bind("blur", function() {
    if (user.isPlayer) {
      a.field.controls.startListener()
    }
    a.initAppListeners()
  });
  this.appControls = $.proxy(function(c) {
    var d = c.keyCode;
    if (d === 27 || d === 8 || d === 116 || d === 13 || d === 82) {
      c.preventDefault();
      c.stopPropagation();
      return
    }
    if (d === 67) {
      c.preventDefault();
      c.stopPropagation();
      ChatBox.input.focus()
    }
  }, this)
};
sk.App.prototype.setPlayerName = function(c, a) {
  var b = $('<img src="' + a.picture + '" />'),
    f = $('<span class="field-number" />'),
    d = $("<span />"),
    e = c.parent();
  f.html(e.attr("data-opponent") ? (e.attr("data-opponent") * 1) + 1 + ". " : "1. ");
  d.html(a.firstName + " " + a.lastName);
  c.append(b);
  c.append(f);
  c.append(d)
};
sk.App.prototype.setPlayingField = function() {
  $(".field").removeClass("observing");
  this.field = new sk.field.Field({
    container: $(".field .play-area .field-container .canvas-container")
  });
  this.nextShapeView = new sk.field.NextShapeView({
    canvas: $(".field .next-shape-container canvas")
  })
};
sk.App.prototype.setPlayingStatus = function(d) {
  var f = d.c,
    b;
  this.status = d.status;
  user.ready = false;
  for (var c = 0, a = f.length; c < a; c++) {
    if (f[c].id != user.id) {
      this.opponentsCount++;
      this.insertOpponent(f[c])
    }
  }
  this.diffServerTime = d.st - new Date().getTime();
  this.setPlayerName($(".field .play-area .field-container .player-name"), user);
  if (this.status === this.GAME_WAITING) {
    this.field.showReady()
  } else {
    if (this.status === this.GAME_STARTED) {
      this.isOver = true;
      this.field.showWaiting();
      ChatBox.msg(locales.waitGameInProgress);
      for (var e in this.opponents) {
        b = this.opponents[e];
        if (!b.isOver) {
          this.opponents[e].field.showWaiting();
          this.opponents[e].noUpdate = true
        }
      }
      sk.App.Comm.emit("requpd", {
        id: user.id
      })
    } else {
      this.isOver = false;
      user.ready = true;
      this.shapes = d.ss;
      ChatBox.msg(locales.gameStartingIn);
      this.startGameCheck(d.gt)
    }
  }
};
sk.App.prototype.setObservingStatus = function(c) {
  var e = c.c;
  this.status = c.status;
  for (var b = 0, a = e.length; b < a; b++) {
    this.opponentsCount++;
    this.insertOpponent(e[b])
  }
  this.diffServerTime = c.st - new Date().getTime();
  if (this.status === this.GAME_STARTED) {
    this.isOver = true;
    ChatBox.msg(locales.waitGameInProgress);
    for (var d in this.opponents) {
      opponent = this.opponents[d];
      if (!opponent.isOver) {
        this.opponents[d].field.showWaiting();
        this.opponents[d].noUpdate = true
      }
    }
    sk.App.Comm.emit("requpd", {
      id: user.id
    })
  } else {
    if (this.status === this.GAME_STARTING) {
      this.isOver = false;
      ChatBox.msg(locales.gameStartingIn);
      this.startGameCheck(c.gt)
    } else {
      this.isOver = false
    }
  }
};
sk.App.prototype.getPlayingSpot = function(g) {
  var e = this,
    a = g.status,
    d = this.opponents,
    c, b;
  this.setPlayingField();
  if (a === this.GAME_WAITING && this.status === this.GAME_WAITING) {
    this.field.showReady()
  } else {
    if (a === this.GAME_WAITING && this.status === this.GAME_STARTED) {
      this.initListeners();
      this.field.insertShape(this.shapes.shift());
      this.stopInterval();
      this.startInterval();
      this.stopFieldCheckInterval();
      this.startFieldCheckInterval()
    } else {
      if (a === this.GAME_STARTED) {
        this.isOver = true;
        this.field.showWaiting();
        ChatBox.msg(locales.waitGameInProgress)
      } else {
        if (g.ss) {
          this.shapes = g.ss
        }
        this.isOver = false;
        if (!ChatBox.input.is(":focus")) {
          this.field.controls.startListener()
        }
      }
    }
  }
  $(".row .field-container").each(function(j, h) {
    var k = $(h);
    k.attr("opponent-id", "none");
    k.find(".canvas-container").html("");
    k.find(".player-name").html("");
    k.find(".overlay .overlay-content").html(locales.waitingForOpponent + "...");
    k.find(".overlay").show()
  });
  for (var f in d) {
    var b = $('.row .field-container[opponent-id="none"]').first(),
      c = b.find(".canvas-container");
    c.removeClass("disabled");
    b.attr("opponent-id", f);
    d[f].field.move(c);
    e.setPlayerName(b.find(".player-name"), d[f])
  }
};
sk.App.prototype.hidePlayingField = function() {
  if (this.field) {
    this.field.destroy()
  }
  this.field = null;
  $(".field").addClass("observing");
  if (!ChatBox.input.is(":focus")) {
    ChatBox.input.focus()
  }
};
sk.App.prototype.initAppListeners = function() {
  var a = $(document);
  a.bind("keydown", this.appControls)
};
sk.App.prototype.stopAppListeners = function() {
  var a = $(document);
  a.unbind("keydown", this.appControls)
};
sk.App.prototype.reset = function() {
  this.field.reset();
  this.fieldSwitching = false;
  this.nextShapeView.clear();
  this.actionEffectsStack = [];
  this.updateStack = [];
  this.resetLvl();
  $(".stack-container .stack").html("").css({
    left: "300px"
  })
};
sk.App.prototype.startGame = function() {
  this.lvlCheckPoint = new Date().getTime();
  this.status = this.GAME_STARTED;
  clearInterval(this.gameStartInterval);
  delete this.gameStartInterval;
  delete this.startSec;
  delete this.gameStartTime;
  if (user.isPlayer) {
    this.field.controls.startListener()
  }
  this.stopAppListeners();
  this.initAppListeners();
  if (user.isPlayer && user.ready) {
    this.initListeners();
    this.field.insertShape(this.shapes.shift());
    this.startInterval();
    this.startFieldCheckInterval()
  }
};
sk.App.prototype.startGameCheck = function(b) {
  var a = this;
  this.status = this.GAME_STARTING;
  this.isOver = false;
  this.gameStartTime = b - this.diffServerTime;
  this.startSec = -1;
  this.gameStartInterval = setInterval(function() {
    var c = new Date().getTime(),
      d;
    d = Math.floor((a.gameStartTime - c) / 1000);
    if (d != a.startSec) {
      a.startSec = d;
      ChatBox.msg(d + 1)
    }
    if (c >= a.gameStartTime) {
      a.startGame()
    }
  }, 25)
};
sk.App.prototype.initListeners = function() {
  var a = this,
    b = $(document);
  b.bind("gameover", function(c) {
    a.checkSendUpdateStack();
    sk.App.Comm.emit("go", {
      id: user.id
    });
    ChatBox.msg(locales.youLost);
    a.field.showGameOver();
    a.stopInterval();
    a.stopListeners();
    a.stopFieldCheckInterval();
    a.shapes = [];
    a.isOver = true;
    ChatBox.input.focus()
  });
  b.bind("fixshape", function(c) {
    a.stopInterval();
    a.appTimeout = setTimeout(function() {
      if (a.field.insertShape(a.shapes.shift())) {
        a.startInterval()
      }
    }, a.lvlInterval());
    if (a.fieldPositionBuffer) {
      a.updateStack.push({
        type: "m",
        data: a.fieldPositionBuffer
      });
      a.fieldPositionBuffer = null
    }
    a.updateStack.push({
      type: "fix"
    })
  });
  b.bind("control", function(d, e, c) {
    if (a.status != a.GAME_STARTED) {
      return
    }
    switch (e) {
      case "drop":
        if (!a.field.shape) {
          return
        }
        a.stopInterval();
        a.field.dropShape();
        break;
      case "down":
        if (!a.field.shape) {
          return
        }
        a.stopInterval();
        a.startInterval();
        a.field.moveDown();
        break;
      case "move":
        if (!a.field.shape) {
          return
        }
        a.field.moveSideways(c);
        break;
      case "rotate":
        if (!a.field.shape) {
          return
        }
        a.field.rotateShape(c);
        break;
      case "special action":
        a.activateSpecial(c);
        break;
      case "discard":
        a.discardSpecial();
        break
    }
  });
  b.bind("field", function(d, c, e) {
    switch (c) {
      case "insertshape":
        sk.App.Comm.emit("is", {
          id: user.id,
          shapeId: e.shapeId
        });
        a.showNextShape();
        break;
      case "move":
        a.fieldPositionBuffer = e;
        break;
      case "put":
        a.updateStack.push({
          type: "put",
          data: e
        });
        break;
      case "clearlines":
        $(".lines-value").html(($(".lines-value").html() * 1) + e);
        if (a.updateStack.length > 0) {
          sk.App.Comm.emit("fu", {
            id: user.id,
            s: a.updateStack
          });
          a.updateStack = []
        }
        sk.App.Comm.emit("cl", {
          id: user.id,
          c: e
        });
        a.stopFieldCheckInterval();
        a.startFieldCheckInterval();
        break;
      case "insert special":
        a.updateStack.push({
          type: "spe",
          data: e
        });
        break;
      case "switch return":
        if (a.updateStack.length > 0) {
          sk.App.Comm.emit("fu", {
            id: user.id,
            s: a.updateStack
          });
          a.updateStack = []
        }
        sk.App.Comm.emit("sr", {
          id: user.id,
          t: e.target,
          fieldData: e.fieldData
        });
        break;
      case "switched":
        sk.App.Comm.emit("switched", {
          id: user.id,
          fieldData: e
        });
        break
    }
  });
  b.bind("special", function(d, c, e) {
    if (a.fieldPositionBuffer) {
      a.updateStack.push({
        type: "m",
        data: a.fieldPositionBuffer
      });
      a.fieldPositionBuffer = null
    }
    if (a.updateStack.length > 0) {
      sk.App.Comm.emit("fu", {
        id: user.id,
        s: a.updateStack
      });
      a.updateStack = []
    }
    sk.App.Comm.emit("st", {
      id: user.id,
      t: c,
      d: e
    })
  })
};
sk.App.prototype.stopListeners = function() {
  var a = $(document);
  a.unbind("gameover");
  a.unbind("fixshape");
  a.unbind("control");
  a.unbind("field");
  a.unbind("special")
};
sk.App.prototype.startInterval = function() {
  var b = new Date().getTime(),
    a = this;
  if ((b - this.lvlCheckPoint) > this.lvlDuration()) {
    this.nextLvl()
  }
  this.appInterval = setInterval(function() {
    a.field.moveDown()
  }, this.lvlInterval())
};
sk.App.prototype.stopInterval = function() {
  if (this.appTimeout) {
    clearTimeout(this.appTimeout);
    this.appTimeout = null
  }
  if (this.appInterval) {
    clearInterval(this.appInterval);
    this.appInterval = null
  }
};
sk.App.prototype.checkSendUpdateStack = function() {
  if (this.fieldPositionBuffer) {
    this.updateStack.push({
      type: "m",
      data: this.fieldPositionBuffer
    });
    this.fieldPositionBuffer = null
  }
  if (this.updateStack.length > 0) {
    sk.App.Comm.emit("fu", {
      id: user.id,
      s: this.updateStack
    });
    this.updateStack = []
  }
};
sk.App.prototype.startFieldCheckInterval = function() {
  var a = this;
  this.fieldCheckInterval = setInterval(function() {
    a.checkSendUpdateStack()
  }, Math.floor(this.lvlInterval() / 3))
};
sk.App.prototype.stopFieldCheckInterval = function() {
  if (this.fieldCheckInterval) {
    clearTimeout(this.fieldCheckInterval);
    this.fieldCheckInterval = null
  }
};
sk.App.prototype.insertOpponent = function(a) {
  var b = $('.row .field-container[opponent-id="none"]').first(),
    c = b.find(".canvas-container");
  c.removeClass("disabled");
  b.attr("opponent-id", a.id);
  a.field = new sk.field.DummyField({
    container: c
  });
  if (a.isOver) {
    a.field.showGameOver()
  }
  if (a.waiting || this.status === this.GAME_WAITING) {
    a.isOver = true;
    a.field.showWaiting()
  }
  if ((this.status === this.GAME_STARTING && !a.waiting) || (this.status === this.GAME_STARTED && !a.isOver)) {
    a.field.hideOverlay()
  }
  if (a.waiting) {
    delete a.waiting
  }
  this.opponents[a.id] = a;
  this.setPlayerName(b.find(".player-name"), a)
};
sk.App.prototype.checkAvailableSpot = function() {
  var a, b;
  if (user.isPlayer || $(".join-this").length) {
    return
  }
  if (this.opponentsCount < room.maxPlayers) {
    a = $('.row .field-container[opponent-id="none"]').last().find(".overlay");
    b = $('<a href="#" class="join-this">' + locales.clickToPlay + "</a>");
    a.find(".overlay-content").html("").append(b);
    b.bind("click", function(c) {
      c.preventDefault();
      c.stopPropagation();
      sk.App.Comm.emit("playspot", {
        id: user.id
      })
    });
    a.show()
  }
};
sk.App.prototype.switchIt = function(c, b) {
  var a = this;
  this.updateStack = [];
  this.stopInterval();
  this.field.switchWith(c);
  sk.App.Comm.emit("su", {
    f: c.id,
    t: c.t,
    b: "S",
    all: true
  });
  if (b) {
    if (!this.field.shape) {
      this.appTimeout = setTimeout(function() {
        if (a.field.insertShape(a.shapes.shift())) {
          a.startInterval()
        }
      }, this.lvlInterval())
    } else {
      this.startInterval()
    }
  }
};
sk.App.prototype.removeOpponent = function(a) {
  var b = $('.row .field-container[opponent-id="' + a + '"]');
  b.find(".canvas-container").addClass("disabled").html("");
  b.find(".player-name").html(" ");
  b.attr("opponent-id", "none");
  b.find(".overlay .overlay-content").html(locales.waitingForOpponent + "...");
  b.find(".overlay").show();
  this.opponentsCount--;
  delete this.opponents[a]
};
sk.App.prototype.cancelStartGame = function() {
  if (this.gameStartInterval) {
    clearInterval(this.gameStartInterval);
    delete this.gameStartInterval;
    ChatBox.msg(locales.cancelStart);
    ChatBox.msg(locales.waitingOtherPlayers)
  }
};
sk.App.prototype.showNextShape = function() {
  var a = sk.Shapes.getShape(this.shapes[0]);
  this.nextShapeView.clear();
  this.nextShapeView.show(a.pos[0].arr, a.color.f)
};
$(function() {
  if ($("body").width() < 1090) {
    $(".item-ref-container").css({
      left: "-178px"
    }).addClass("collapsed")
  }
  if ($("body").width() < 1155) {
    $(".controls-ref-container").css({
      right: "-188px"
    }).addClass("collapsed")
  }
  $(".item-ref-container").delegate("a", "click", function(b) {
    var c = $(this),
      d = $(".item-ref-container");
    b.preventDefault();
    b.stopPropagation();
    if (c.hasClass("close")) {
      d.css({
        left: "-178px"
      }).addClass("collapsed")
    } else {
      if (d.hasClass("collapsed")) {
        d.removeClass("collapsed").css({
          left: "0"
        })
      } else {
        d.css({
          left: "-178px"
        }).addClass("collapsed")
      }
    }
  });
  $(".controls-ref-container").delegate("a", "click", function(b) {
    var c = $(this),
      d = $(".controls-ref-container");
    b.preventDefault();
    b.stopPropagation();
    if (c.hasClass("close")) {
      d.css({
        right: "-188px"
      }).addClass("collapsed")
    } else {
      if (d.hasClass("collapsed")) {
        d.removeClass("collapsed").css({
          right: "0"
        })
      } else {
        d.css({
          right: "-188px"
        }).addClass("collapsed")
      }
    }
  });
  ChatBox.init($(".messages ul"), $(".chat-input-container input"));
  var a = new sk.App();
  stackSpec = function(b, c) {
    a.stackSpecials(b, c)
  };
  $(".exit-game").bind("click", function() {
    sk.App.Comm.disconnect();
    location.href = "/play"
  });
  a.init()
});
$.fn.sanitizeHTML = function() {
  var a = $(this).children();
  a.each(function() {
    if ($(this).not("b").not("i").not("p").not("br").not("span").length > 0) {
      $(this).replaceWith($(this).text())
    } else {
      $(this).sanitizeHTML()
    }
  });
  return $(this)
};
var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;"
};

function escapeHtml(a) {
  return String(a).replace(/[&<>"'\/]/g, function(b) {
    return entityMap[b]
  })
}
sk.App.Comm = {};
sk.App.Comm.init = function(c) {
  var b = window.location,
    a;
  a = io.connect(b.protocol + "//" + b.hostname + "/game/" + room.id);
  a.on("connect", function() {
    ChatBox.msg(locales.hi + " " + user.firstName);
    a.emit("nc", {
      id: user.id
    })
  });
  a.on("cap", function(d) {
    user.isPlayer = true;
    c.setPlayingField();
    c.setPlayingStatus(d)
  });
  a.on("gs", function(d) {
    if (d.st) {
      c.diffServerTime = d.st - new Date().getTime()
    }
    c.startGameCheck(d.t);
    ChatBox.msg(locales.gameStartingIn)
  });
  a.on("ss", function(d) {
    c.shapes = c.shapes.concat(d.s)
  });
  a.on("gf", function(e) {
    var d;
    if (e) {
      d = e == user.id ? user.firstName : c.opponents[e].firstName
    }
    ChatBox.msg(locales.gameFinished);
    if (e) {
      ChatBox.msg(d + " " + locales.won + "!")
    }
    c.status = c.GAME_WAITING;
    if (user.isPlayer) {
      c.stopInterval();
      c.stopListeners();
      c.stopFieldCheckInterval();
      c.field.showReady()
    }
    c.shapes = [];
    if (!ChatBox.input.is(":focus")) {
      ChatBox.input.focus()
    }
    for (var f in c.opponents) {
      c.opponents[f].noUpdate = false;
      c.opponents[f].field.view.isBlind = false;
      c.opponents[f].field.view.refresh();
      c.opponents[f].field.showWaiting()
    }
  });
  a.on("pc", function(d) {
    c.opponentsCount++;
    c.insertOpponent(d);
    ChatBox.msg(d.firstName + " " + locales.connected)
  });
  a.on("playerready", function(e) {
    var d = c.opponents[e.id];
    if (d) {
      d.isOver = false;
      d.field.hideOverlay();
      d.field.reset()
    }
  });
  a.on("go", function(e) {
    var d = c.opponents[e.id];
    d.isOver = true;
    d.field.showGameOver();
    ChatBox.msg(d.firstName + " " + locales.lost)
  });
  a.on("requpd", function(d) {
    if (!c.isOver && user.isPlayer) {
      sk.App.Comm.emit("retupd", {
        id: user.id,
        t: d.id,
        fieldData: c.field.getFieldData()
      })
    }
  });
  a.on("retupd", function(e) {
    var d = c.opponents[e.id];
    if (!d || !d.noUpdate) {
      return
    }
    d.noUpdate = false;
    if (c.status === c.GAME_STARTED) {
      d.field.hideOverlay();
      d.field.switchWith(e.fd)
    }
  });
  a.on("inactive", function(e) {
    var f = e.id,
      d;
    if (user.id === f && user.isPlayer) {
      if (user.ready) {
        c.stopListeners();
        c.stopInterval();
        c.stopFieldCheckInterval()
      }
      user.isPlayer = false;
      c.hidePlayingField()
    } else {
      d = c.opponents[f];
      if (d) {
        d.isOver = true;
        c.removeOpponent(f)
      }
    }
    c.checkAvailableSpot()
  });
  a.on("getspot", function(d) {
    user.isPlayer = true;
    c.getPlayingSpot(d)
  });
  a.on("failgetspot", function() {
    ChatBox.msg(locales.failSpot);
    c.checkAvailableSpot()
  });
  a.on("cao", function(d) {
    user.isPlayer = false;
    c.setObservingStatus(d)
  });
  a.on("cs", function() {
    c.cancelStartGame()
  });
  a.on("is", function(d) {
    if (!c.opponents[d.id].noUpdate) {
      c.opponents[d.id].field.insertShape(d.shapeId)
    }
  });
  a.on("fu", function(d) {
    if (!c.opponents[d.id].noUpdate) {
      c.opponents[d.id].field.update(d.s)
    }
  });
  a.on("sb", function(d) {
    if (user.isPlayer) {
      c.field.addSpecials(d.b)
    }
  });
  a.on("ba", function(d) {
    if (c.isOver || !user.isPlayer) {
      return
    }
    if (user.id != d.f && (!d.hasOwnProperty("t") || d.t == user.id)) {
      if (c.fieldSwitching) {
        c.actionEffectsStack.push({
          type: d.b,
          param: d.p
        });
        return
      }
      c.field.applyAction(d.b, d.p)
    }
  });
  a.on("su", function(d) {
    ChatBox.userTo((d.f == user.id ? user.firstName : c.opponents[d.f].firstName), (d.t == user.id ? user.firstName : c.opponents[d.t].firstName), d.b)
  });
  a.on("st", function(d) {
    if (!c.opponents[d.id].noUpdate) {
      c.opponents[d.id].field.updateSpecialTrigger(d)
    }
  });
  a.on("ts", function(d) {
    if (c.isOver || !user.isPlayer) {
      return
    }
    if (c.fieldSwitching) {
      c.actionEffectsStack.push({
        type: "switch",
        param: d,
        fn: $.proxy(c.switchIt, c)
      });
      return
    }
    c.switchIt(d, true)
  });
  a.on("sr", function(d) {
    if (c.status === c.GAME_WAITING || c.status === c.GAME_STARTING) {
      return
    }
    c.field.hideOverlay();
    c.initListeners();
    if (d !== "failed") {
      c.field.switchWith(d.fieldData, true)
    } else {
      ChatBox.msg(locales.switchFailed)
    }
    if (c.actionEffectsStack.length > 0) {
      c.field.applyEffectsStack(c.actionEffectsStack, c);
      c.actionEffectsStack = []
    }
    c.fieldSwitching = false;
    if (!c.field.shape) {
      c.appTimeout = setTimeout(function() {
        if (c.field.insertShape(c.shapes.shift())) {
          c.startInterval()
        }
      }, c.lvlInterval())
    } else {
      c.startInterval()
    }
    c.startFieldCheckInterval()
  });
  a.on("switched", function(d) {
    if (!c.opponents[d.id].noUpdate) {
      c.opponents[d.id].field.switchWith(d.fieldData)
    }
  });
  a.on("pd", function(e) {
    var d = c.opponents[e.id];
    d.isOver = true;
    c.removeOpponent(e.id);
    ChatBox.msg(d.firstName + " " + locales.disconnected);
    c.checkAvailableSpot()
  });
  a.on("msg", function(d) {
    d.t = escapeHtml(d.t);
    console.log(d.t);
    ChatBox.userMsg(c.opponents[d.id].firstName, d.t)
  });
  a.on("obsmsg", function(d) {
    d.t = escapeHtml(d.t);
    console.log(d.t);
    ChatBox.obsMsg(d.n, d.t)
  });
  a.on("disconnect", function() {});
  this.socket = a
};
sk.App.Comm.emit = function(a, b) {
  this.socket.emit(a, b)
};
sk.App.Comm.disconnect = function() {
  this.socket.disconnect()
};
sk.field.NextShapeView = function(b) {
  var a = {
    blockColor: "#fa5400",
    blockBorder: "#333333",
    columns: 5,
    rows: 5
  };
  $.extend(a, b);
  this.canvas = a.canvas;
  this.context = this.canvas.get(0).getContext("2d");
  delete a.container;
  this.options = a;
  this.blockWidth = Math.floor(this.canvas.width() / a.columns);
  this.blockHeight = Math.floor(this.canvas.height() / a.rows)
};
sk.field.NextShapeView.prototype.clear = function() {
  this.context.clearRect(0, 0, this.canvas.width(), this.canvas.height())
};
sk.field.NextShapeView.prototype.show = function(l, g) {
  var e = this.blockWidth,
    o = this.blockHeight,
    d = this.context,
    p = l.length,
    q = this.options,
    b = l[0].length,
    j, h, k = Math.floor((this.options.columns - b) / 2 * e),
    i = Math.floor((this.options.rows - p) / 2 * o);
  d.strokeStyle = q.blockBorder;
  d.lineWidth = 1;
  d.fillStyle = g;
  for (var a = 0, f = l.length; a < f; a++) {
    for (var m = 0, n = l[a].length; m < n; m++) {
      if (l[a][m] == 1) {
        j = k + (m * e);
        h = i + (a * o);
        d.fillRect(j, h, e, o);
        d.strokeRect(j + 0.5, h + 0.5, e - 1, o - 1)
      }
    }
  }
};
sk.field.BaseField = function(b) {
  if (!arguments.callee.caller) {
    return
  }
  var a = {
    columns: 10,
    minWidth: 100,
    rows: 20,
    startPoint: [0, 4]
  };
  $.extend(a, b);
  this.viewContainer = a.container;
  delete a.container;
  this.options = a;
  this.shape = null;
  this.pivotPosition = [];
  this.overlay = this.viewContainer.parent(".field-container").find(".overlay")
};
sk.field.BaseField.prototype.setSize = function() {
  var d = this.options,
    a = $(document.body),
    c = a.height() - 100,
    e = Math.floor(c / d.rows),
    b = Math.floor((a.width() / 2) - 100);
  if ((d.columns * e) > b) {
    e = Math.floor(b / d.columns)
  }
  this.viewContainer.css({
    height: (d.rows * e) + "px",
    width: (d.columns * e) + "px"
  })
};
sk.field.BaseField.prototype.cleanLine = function() {
  var b = this.shape,
    a = this.view;
  if (b) {
    a.removeShape()
  }
  a.cleanLine();
  if (b) {
    a.insertShape(this.pivotPosition, b.pos[b.currentPos])
  }
  a.refresh()
};
sk.field.BaseField.prototype.switchWith = function(a) {
  this.view.setField(a.field);
  if (a.shape) {
    this.pivotPosition = a.pivot;
    this.view.insertShape(this.pivotPosition, a.shape.pos[a.shape.currentPos], a.shape.color);
    this.shape = a.shape
  } else {
    this.shape = null
  }
  this.view.refresh()
};
sk.field.BaseField.prototype.applyGravity = function() {
  return this.view.gravity()
};
sk.field.BaseField.prototype.nukeField = function() {
  var a = this.view,
    b = this.shape;
  a.clear();
  if (b) {
    a.insertShape(this.pivotPosition, b.pos[b.currentPos])
  }
};
sk.field.BaseField.prototype.clearSpecials = function() {
  this.view.clearSpecials();
  this.view.refresh()
};
sk.field.BaseField.prototype.reset = function() {
  if (this.view.isBlind) {
    this.unBlindField()
  }
  this.view.clear()
};
sk.field.BaseField.prototype.showGameOver = function() {
  var a = $("<div>" + locales.gameOver + "</div>"),
    b = this.overlay.find(".overlay-content");
  this.hideOverlay();
  b.append(a);
  this.overlay.show()
};
sk.field.BaseField.prototype.showWaiting = function() {
  var b = $("<div>" + locales.waiting + "...</div>"),
    a = this.overlay.find(".overlay-content");
  this.hideOverlay();
  a.append(b);
  this.overlay.show()
};
sk.field.BaseField.prototype.hideOverlay = function() {
  this.overlay.find(".overlay-content").html("");
  this.overlay.hide()
};
sk.field.DummyField = function(a) {
  sk.field.BaseField.call(this, a);
  this._super = sk.field.BaseField.prototype;
  this.view = new sk.field.DummyFieldView({
    container: this.viewContainer
  });
  this.view.render()
};
sk.field.DummyField.prototype = new sk.field.BaseField();
sk.field.DummyField.prototype.constructor = sk.field.DummyField;
sk.field.DummyField.prototype.insertShape = function(e) {
  var a = sk.Shapes.getShape(e),
    c = a.pos[0],
    b = c.arr.length,
    d = [];
  d[0] = c.pivot[0];
  d[1] = this.options.startPoint[1];
  a.currentPos = 0;
  this.shape = a;
  this.view.insertShape(d, c, a.color);
  this.pivotPosition = d
};
sk.field.DummyField.prototype.update = function(b) {
  var c = this.view,
    e;
  for (var d = 0, a = b.length; d < a; d++) {
    e = b[d].type;
    if (e == "fix") {
      c.fixShape();
      this.shape = null
    } else {
      if (e == "m") {
        this.moveShape(b[d].data)
      } else {
        if (e == "spe") {
          c.insertSpecials(b[d].data)
        } else {
          if (e === "put") {
            c.insertShape(b[d].data.newPos, b[d].data.posObj, b[d].data.color)
          }
        }
      }
    }
  }
};
sk.field.DummyField.prototype.moveShape = function(b) {
  var a = this.view;
  a.removeShape();
  a.insertShape(b.newPos, b.posObj);
  this.pivotPosition = b.newPos;
  if (b.hasOwnProperty("shapePos")) {
    this.shape.currentPos = b.shapePos
  }
};
sk.field.DummyField.prototype.insertLine = function(b) {
  var a = this.view,
    c = this.shape;
  if (c) {
    a.removeShape()
  }
  a.insertLine(b);
  if (c) {
    a.insertShape(this.pivotPosition, c.pos[c.currentPos])
  }
  a.refresh()
};
sk.field.DummyField.prototype.applyGravity = function(c) {
  var b = this.shape,
    a = this.view;
  if (b) {
    a.removeShape()
  }
  this.view.setField(c);
  this.view.refresh();
  this.view.checkLines();
  if (b) {
    a.insertShape(this.pivotPosition, b.pos[b.currentPos])
  }
};
sk.field.DummyField.prototype.earthquake = function(a) {
  this.view.replaceRows(a);
  this.view.refresh()
};
sk.field.DummyField.prototype.bombField = function(a) {
  this.view.replaceRows(a);
  this.view.refresh()
};
sk.field.DummyField.prototype.randomClear = function(a) {
  this.view.replaceRows(a);
  this.view.refresh()
};
sk.field.DummyField.prototype.updateSpecialTrigger = function(b) {
  var a = b.t;
  switch (a) {
    case "add line":
      this.insertLine(b.d);
      break;
    case "clean line":
      this.cleanLine();
      break;
    case "gravity":
      this.applyGravity(b.d);
      break;
    case "earthquake":
      this.earthquake(b.d);
      break;
    case "nuke":
      this.nukeField();
      break;
    case "clear specials":
      this.clearSpecials();
      break;
    case "bomb":
      this.bombField(b.d);
      break;
    case "random clear":
      this.randomClear(b.d);
      break;
    case "blind":
      this.view.blind();
      break;
    case "unblind":
      this.view.isBlind = false;
      this.view.refresh();
      break
  }
};
sk.field.DummyField.prototype.move = function(a) {
  this.viewContainer = a;
  this.overlay = this.viewContainer.parent(".field-container").find(".overlay");
  this.hideOverlay();
  this.view.options.container = a;
  this.view.render();
  this.view.refresh()
};
sk.field.Field = function(a) {
  sk.field.BaseField.call(this, a);
  this._super = sk.field.BaseField.prototype;
  this.view = new sk.field.FieldView({
    container: this.viewContainer
  });
  this.view.render();
  this.controls = new sk.controls.Keyboard({
    container: this.viewContainer
  })
};
sk.field.Field.prototype = new sk.field.BaseField();
sk.field.Field.prototype.constructor = sk.field.Field;
sk.field.Field.prototype.insertShape = function(f) {
  var a = sk.Shapes.getShape(f),
    d = a.pos[0],
    c = d.arr.length,
    e = [],
    b = 1;
  e[0] = d.pivot[0];
  e[1] = this.options.startPoint[1];
  a.currentPos = 0;
  this.shape = a;
  if (!this.view.checkCollision(e, d)) {
    this.view.insertShape(e, d, a.color);
    this.pivotPosition = e;
    this.viewContainer.trigger("field", ["insertshape", {
      shapeId: f
    }]);
    return true
  } else {
    e[0]--;
    while (this.view.checkCollision(e, d)) {
      e[0]--
    }
    this.view.insertShape(e, d, a.color);
    this.viewContainer.trigger("field", ["put", {
      newPos: e,
      posObj: d,
      color: a.color
    }]);
    this.view.gameOver();
    return false
  }
};
sk.field.Field.prototype.dropShape = function() {
  var a = this.view,
    c = this.shape,
    b = c.pos[c.currentPos];
  newPos = [];
  newPos[0] = this.pivotPosition[0] + 1;
  newPos[1] = this.pivotPosition[1];
  while (!a.checkCollision(newPos, b)) {
    newPos[0] += 1;
    this.pivotPosition[0] += 1
  }
  a.removeShape();
  a.insertShape(this.pivotPosition, b);
  this.viewContainer.trigger("field", ["move", {
    newPos: this.pivotPosition,
    posObj: b
  }]);
  a.fixShape();
  this.shape = null;
  this.pivotPosition = []
};
sk.field.Field.prototype.move = function(d) {
  var a = this.view,
    c = this.shape,
    b = c.pos[c.currentPos],
    e = [],
    f = false;
  e[0] = this.pivotPosition[0] + d[0];
  e[1] = this.pivotPosition[1] + d[1];
  if (!a.checkCollision(e, b)) {
    f = true;
    a.removeShape();
    a.insertShape(e, b);
    this.pivotPosition = e;
    this.viewContainer.trigger("field", ["move", {
      newPos: e,
      posObj: b,
      shapePos: c.currentPos
    }])
  }
  return f
};
sk.field.Field.prototype.moveDown = function() {
  if (!this.move([1, 0])) {
    this.view.fixShape();
    this.shape = null;
    this.pivotPosition = []
  }
};
sk.field.Field.prototype.moveSideways = function(a) {
  this.move([0, a])
};
sk.field.Field.prototype.rotateShape = function(c) {
  var b = this.shape,
    f = b.pos,
    a = this.view,
    e = b.currentPos,
    d;
  if (f.length == 1) {
    return
  }
  d = (e + c) == f.length ? 0 : ((e + c) < 0 ? f.length - 1 : e + c);
  if (!a.checkCollision(this.pivotPosition, f[d])) {
    a.removeShape();
    a.insertShape(this.pivotPosition, f[d]);
    b.currentPos = d;
    this.viewContainer.trigger("field", ["move", {
      newPos: this.pivotPosition,
      posObj: f[d],
      shapePos: d
    }])
  }
};
sk.field.Field.prototype.addSpecials = function(a) {
  this.view.insertSpecials(a)
};
sk.field.Field.prototype.insertLine = function(e) {
  var d = e || 1,
    a = this.view,
    b = this.shape,
    c = [];
  c[0] = this.pivotPosition[0] + d;
  c[1] = this.pivotPosition[1];
  if (b && a.checkCollision(c, b.pos[b.currentPos])) {
    if (d > 1) {
      this.dropShape()
    } else {
      a.fixShape();
      this.shape = null
    }
  }
  if (this.shape) {
    a.removeShape()
  }
  a.insertLine(d);
  if (this.shape) {
    a.insertShape(this.pivotPosition, b.pos[b.currentPos])
  }
  a.refresh()
};
sk.field.Field.prototype.applyGravity = function() {
  var b = this.shape,
    a = this.view;
  if (b) {
    a.removeShape()
  }
  if (this._super.applyGravity.call(this)) {
    this.viewContainer.trigger("special", ["gravity", a.getField()]);
    a.refresh();
    this.view.checkLines()
  }
  if (b) {
    a.insertShape(this.pivotPosition, b.pos[b.currentPos])
  }
};
sk.field.Field.prototype.earthquake = function() {
  var a = this.view.earthquake();
  if (a.length > 0) {
    this.view.refresh()
  }
  this.viewContainer.trigger("special", ["earthquake", a])
};
sk.field.Field.prototype.nukeField = function() {
  this._super.nukeField.call(this);
  this.viewContainer.trigger("special", ["nuke"])
};
sk.field.Field.prototype.clearSpecials = function() {
  this._super.clearSpecials.call(this);
  this.viewContainer.trigger("special", ["clear specials"])
};
sk.field.Field.prototype.bombField = function() {
  var a = this.view.bombField();
  if (a.length > 0) {
    this.view.refresh()
  }
  this.viewContainer.trigger("special", ["bomb", a])
};
sk.field.Field.prototype.randomClear = function() {
  var a = this.view.randomClear();
  if (a.length) {
    this.view.refresh()
  }
  this.viewContainer.trigger("special", ["random clear", a])
};
sk.field.Field.prototype.unBlindField = function() {
  this.view.isBlind = false;
  this.view.refresh();
  clearInterval(this.blindInterval);
  this.viewContainer.trigger("special", ["unblind"])
};
sk.field.Field.prototype.blindField = function() {
  var a = this;
  if (!this.view.isBlind) {
    this.view.blind();
    this.blindStartCheck = new Date().getTime();
    this.blindTime = 3000;
    this.blindInterval = setInterval(function() {
      a.blindTime -= 500;
      if (a.blindTime <= 0) {
        a.unBlindField()
      }
    }, 500);
    this.viewContainer.trigger("special", ["blind"])
  } else {
    this.blindTime += 3000
  }
};
sk.field.Field.prototype.applyAction = function(b, a) {
  switch (b) {
    case "A":
      this.insertLine(a);
      break;
    case "C":
      this.cleanLine();
      break;
    case "G":
      this.applyGravity();
      break;
    case "E":
      this.earthquake();
      break;
    case "N":
      this.nukeField();
      break;
    case "B":
      this.clearSpecials();
      break;
    case "O":
      this.bombField();
      break;
    case "R":
      this.randomClear();
      break;
    case "D":
      this.blindField();
      break
  }
};
sk.field.Field.prototype.getFieldData = function() {
  return {
    field: [].concat(this.view.getField()),
    pivot: this.pivotPosition,
    shape: this.shape
  }
};
sk.field.Field.prototype.switchWith = function(b, a) {
  if (!a) {
    this.viewContainer.trigger("field", ["switch return", {
      target: b.id,
      fieldData: this.getFieldData()
    }])
  }
  this._super.switchWith.call(this, b);
  this.viewContainer.trigger("field", ["switched", this.getFieldData()])
};
sk.field.Field.prototype.applyEffectsStack = function(a, c) {
  var b;
  while (a.length > 0) {
    b = a.shift();
    if (b.fn) {
      b.fn(b.param)
    } else {
      this.applyAction(b.type, b.param)
    }
  }
};
sk.field.Field.prototype.showSwitching = function() {
  var a = $('<img src="/images/loader-switching.gif" />');
  this.hideOverlay();
  this.overlay.find(".overlay-content").append(a);
  this.overlay.show()
};
sk.field.Field.prototype.showPlayAgain = function() {
  var a = $("<div>" + locales.playAgain + "?</div>"),
    c = $('<input type="button" value="' + locales.yes + '">'),
    b = $('<input type="button" value="' + locales.no + '">'),
    d = this.overlay.find(".overlay-content");
  this.hideOverlay();
  c.bind("click", function(e) {
    $(this).trigger("replay")
  });
  b.bind("click", function(e) {
    $(this).trigger("leave")
  });
  d.append(a);
  d.append(c);
  d.append(b);
  this.overlay.show()
};
sk.field.Field.prototype.showReady = function() {
  var a = $("<div>" + locales.isReady + "?</div>"),
    c = $('<input type="button" value="' + locales.yes + '">'),
    b = $('<input type="button" value="' + locales.no + '">'),
    d = this.overlay.find(".overlay-content");
  this.hideOverlay();
  c.bind("click", function(e) {
    $(this).trigger("playerready")
  });
  b.bind("click", function(e) {
    $(this).trigger("playernotready")
  });
  d.append(a);
  d.append(c);
  d.append(b);
  this.overlay.show()
};
sk.field.Field.prototype.destroy = function() {
  this.controls.stopListener();
  delete this.controls;
  this.view.destroy();
  delete this.view
};
sk.field.BaseView = function(g) {
  if (!arguments.callee.caller) {
    return
  }
  var d = {
    activeColor: "#777",
    blockColors: ["#d00", "#00d", "#0d0", "#dd0", "#d80"],
    colorIndex: 0,
    columns: 10,
    dummyColor: "#bbb",
    fontSize: 18,
    rows: 20,
    specialBackground: "#999"
  };
  $.extend(d, g);
  var b = d.rows,
    e = d.columns,
    a = [],
    f = [];
  delete d.rows;
  delete d.columns;
  this.fontSize = d.fontSize;
  delete d.fontSize;
  this.options = d;
  this.clearField = function() {
    for (var h = 0; h < b; h++) {
      a[h] = [];
      for (var c = 0; c < e; c++) {
        a[h][c] = "b"
      }
    }
  };
  this.clearField();
  this.rows = function(c) {
    if (c) {
      b = c
    }
    return b
  };
  this.columns = function(c) {
    if (c) {
      e = c
    }
    return e
  };
  this.getField = function() {
    return a
  };
  this.setField = function(c) {
    a = c
  };
  this.fieldPos = function(c) {
    if (c) {
      f = c
    }
    return f
  };
  this.activeShape = null;
  this.shapeColor;
  this.blocksCount = 0
};
sk.field.BaseView.prototype.render = function() {
  var a = this.options.container;
  this.el = $("<canvas />");
  a.append(this.el);
  this.context = this.el.get(0).getContext("2d");
  this.setDimensions();
  return this.el
};
sk.field.BaseView.prototype.setDimensions = function() {
  var a = this.options.container,
    b = this.el;
  b.attr("height", a.height());
  b.attr("width", a.width());
  this.blockHeight = b.height() / this.rows();
  this.blockWidth = b.width() / this.columns()
};
sk.field.BaseView.prototype.clear = function() {
  var a = this.el;
  this.clearField();
  if (!this.isBlind) {
    this.context.clearRect(0, 0, a.width(), a.height())
  }
};
sk.field.BaseView.prototype.insertShape = function(l, b, e) {
  var d = b.pivot,
    k = b.arr,
    n = l[0] - d[0],
    c = l[1] - d[1],
    h = this.getField();
  if (e) {
    this.shapeColor = e
  }
  this.fieldPos([n, c]);
  for (var g = 0, m = k.length; g < m; g++) {
    if (n >= 0) {
      for (var f = 0, a = k[g].length; f < a; f++) {
        if (k[g][f] > 0) {
          h[n][c + f] = "s";
          this.drawBlock(n, c + f, this.shapeColor.m)
        }
      }
    }
    n += 1
  }
  this.activeShape = k
};
sk.field.BaseView.prototype.gameOver = function() {};
sk.field.BaseView.prototype.newLine = function() {
  var a = [];
  for (var b = 0; b < this.columns(); b++) {
    a.push("b")
  }
  return a
};
sk.field.BaseView.prototype.checkLines = function() {
  var e = 0,
    f = this.getField(),
    g = 0,
    d = 0,
    h = true,
    b = this,
    a = [],
    c;
  while (f[g]) {
    c = [];
    while (h && f[g][d]) {
      if (f[g][d] == "b") {
        h = false
      } else {
        if (f[g][d] != "s" && f[g][d].indexOf("#") < 0) {
          c.push(f[g][d])
        }
      }
      d += 1
    }
    d = 0;
    if (h) {
      this.blocksCount -= f[g].length;
      e += 1;
      f.splice(g, 1);
      f.splice(0, 0, this.newLine());
      a = a.concat(c)
    } else {
      h = true
    }
    g += 1
  }
  return {
    c: e,
    specials: a
  }
};
sk.field.BaseView.prototype.fixShape = function() {
  var h = this.getField(),
    l = this.activeShape,
    k = this.fieldPos(),
    m = k[0],
    b = k[1],
    a = this.options,
    d;
  if (m < 0) {
    this.gameOver();
    return false
  }
  if (a.blockColors[a.colorIndex]) {
    d = a.blockColors[a.colorIndex++]
  } else {
    a.colorIndex = 0;
    d = a.blockColors[a.colorIndex++]
  }
  for (var f = 0, c = l.length; f < c; f++) {
    for (var e = 0, g = l[f].length; e < g; e++) {
      if (h[m][b + e] == "s") {
        h[m][b + e] = this.shapeColor.f;
        this.drawBlock(m, b + e, this.shapeColor.f);
        this.blocksCount++
      }
    }
    m += 1
  }
  this.checkLines();
  return true
};
sk.field.BaseView.prototype.removeShape = function() {
  var f = this.getField(),
    h = this.activeShape,
    g = this.fieldPos(),
    k = g[0],
    a = g[1];
  for (var d = 0, b = h.length; d < b; d++) {
    if (k >= 0) {
      for (var c = 0, e = h[d].length; c < e; c++) {
        if (h[d][c] > 0) {
          f[k][a + c] = "b";
          this.eraseBlock(k, a + c)
        }
      }
    }
    k += 1
  }
};
sk.field.BaseView.prototype.eraseBlock = function(c, b) {
  var a = b * this.blockWidth,
    d = c * this.blockHeight;
  if (this.isBlind) {
    return
  }
  this.context.clearRect(a, d, this.blockWidth, this.blockHeight)
};
sk.field.BaseView.prototype.drawBlock = function(e, c, b) {
  var d = this.context,
    a = c * this.blockWidth,
    f = e * this.blockHeight;
  if (this.isBlind) {
    return
  }
  d.strokeStyle = "#333333";
  d.fillStyle = b ? b : "#000";
  d.lineWidth = 1;
  d.fillRect(a, f, this.blockWidth, this.blockHeight);
  d.strokeRect(a + 0.5, f + 0.5, this.blockWidth - 1, this.blockHeight - 1)
};
sk.field.BaseView.prototype.drawSpecial = function(e, c, b) {
  var d = this.context,
    a = c * this.blockWidth,
    f = e * this.blockHeight;
  if (this.isBlind) {
    return
  }
  this.drawBlock(e, c, this.options.specialBackground);
  a += this.blockWidth / 2;
  f += this.blockHeight / 2;
  d.font = this.fontSize + "px courier";
  d.textBaseline = "middle";
  d.textAlign = "center";
  d.fillStyle = "#000";
  d.fillText(b, a, f)
};
sk.field.BaseView.prototype.refresh = function() {
  var d = this.getField();
  this.blocksCount = 0;
  if (!this.isBlind) {
    this.context.clearRect(0, 0, this.el.width(), this.el.height())
  }
  for (var b = 0, f = d.length; b < f; b++) {
    for (var e = 0, a = d[b].length; e < a; e++) {
      if (d[b][e] != "b" && d[b][e].indexOf("#") < 0 && d[b][e] != "s") {
        this.drawSpecial(b, e, d[b][e])
      } else {
        if (d[b][e] != "b") {
          this.drawBlock(b, e, (d[b][e] == "s" ? this.shapeColor.m : d[b][e]));
          if (d[b][e] != "s") {
            this.blocksCount++
          }
        }
      }
    }
  }
};
sk.field.BaseView.prototype.insertLine = function(n) {
  var n = n || [],
    e, m = this.columns(),
    k = false,
    h = this.getField(),
    l = false;
  if (typeof n == "number") {
    e = n;
    n = [];
    for (var a = 0; a < e; a++) {
      n[a] = [];
      for (var g = 0; g < m; g++) {
        if (!k) {
          if (Math.floor(Math.random() * m) === 0 || g == (m - 1)) {
            k = true;
            n[a].push("b")
          } else {
            n[a].push(this.options.dummyColor)
          }
        } else {
          n[a].push(this.options.dummyColor)
        }
      }
      k = false
    }
  }
  for (var d = 0, f = n.length; d < f; d++) {
    for (var b = 0; b < m; b++) {
      if (h[d][b] != "b") {
        l = true
      }
    }
  }
  h.splice(0, n.length);
  n.forEach(function(c) {
    h.push(c)
  });
  return {
    lines: n,
    collision: l
  }
};
sk.field.BaseView.prototype.cleanLine = function() {
  var a = this.getField();
  a.pop();
  a.unshift(this.newLine())
};
sk.field.BaseView.prototype.gravity = function() {
  var h = this.getField(),
    d = false,
    e, i = false,
    c, g;
  for (var b = 0, j = this.columns(); b < j; b++) {
    for (var k = 0, f = this.rows(); k < f; k++) {
      c = h[k][b];
      if (c != "b" && c != "s") {
        d = true;
        if (!e) {
          e = k
        }
      } else {
        if (d) {
          i = true;
          for (var a = k; a > e; a--) {
            g = h[a - 1][b];
            h[a - 1][b] = h[a][b];
            h[a][b] = g
          }
          e++
        }
      }
    }
    e = null;
    d = false
  }
  return i
};
sk.field.BaseView.prototype.clearSpecials = function() {
  var d = this.getField();
  for (var b = 0, f = d.length; b < f; b++) {
    for (var e = 0, a = d[b].length; e < a; e++) {
      if (d[b][e] != "b" && d[b][e].indexOf("#") < 0 && d[b][e] != "s") {
        d[b][e] = this.options.dummyColor;
        this.blocksCount++
      }
    }
  }
};
sk.field.BaseView.prototype.blind = function() {
  this.isBlind = true;
  this.context.fillStyle = "#333333";
  this.context.fillRect(0, 0, this.el.width(), this.el.height())
};
sk.field.BaseView.prototype.destroy = function() {
  this.el.remove()
};
sk.field.FieldView = function(a) {
  sk.field.BaseView.call(this, a);
  this._super = sk.field.BaseView.prototype
};
sk.field.FieldView.prototype = new sk.field.BaseView();
sk.field.FieldView.prototype.constructor = sk.field.FieldView;
sk.field.FieldView.prototype.checkCollision = function(m, a) {
  var b = a.pivot,
    l = $.merge([], a.arr),
    d = m[0] - b[0],
    f = m[1] - b[1],
    k = d >= this.rows() ? true : false,
    g = l.shift(),
    j = this.getField(),
    h, e = 0;
  if (!k) {
    k = (f < 0 || f > this.columns())
  }
  if (!k) {
    k = (d < 0 && (f + g.length) > this.columns())
  }
  while (!k && g) {
    if (d == this.rows()) {
      k = true
    }
    while (!k && e < g.length && d >= 0) {
      h = j[d][f + e];
      k = (h != "b" && h != "s") && (g[e] == 1);
      e += 1
    }
    e = 0;
    d += 1;
    g = l.shift()
  }
  return k
};
sk.field.FieldView.prototype.gameOver = function() {
  this._super.gameOver.call(this);
  this.el.trigger("gameover")
};
sk.field.FieldView.prototype.checkLines = function() {
  var a, d, b = this;

  function as() {
    stackSpec(a.specials, d)
  }
  a = this._super.checkLines.call(this);
  d = a.c;
  if (a.specials.length > 0) {
    as()
  }
  if (d > 0) {
    setTimeout(function() {
      b.refresh();
      b.el.trigger("field", ["clearlines", d])
    }, 50)
  }
};
sk.field.FieldView.prototype.fixShape = function() {
  var a = this._super.fixShape.call(this);
  if (a) {
    this.el.trigger("fixshape")
  }
};
sk.field.FieldView.prototype.insertSpecials = function(f) {
  var e, b, a = this;
  var d = function(l, h) {
    var j = a.getField(),
      i = 0,
      k = 0,
      g = 0;
    while (j[k] && i < l) {
      while (j[k][g] && i < l) {
        if (j[k][g].indexOf("#") > -1) {
          i++
        }
        if (i == l) {
          a.eraseBlock(k, g);
          this.blocksCount--;
          a.drawSpecial(k, g, h);
          j[k][g] = h;
          a.el.trigger("field", ["insert special", {
            row: k,
            col: g,
            block: h
          }])
        }
        g += 1
      }
      g = 0;
      k += 1
    }
  };
  while (this.blocksCount > 0 && f.length > 0) {
    e = f.shift();
    b = Math.floor(Math.random() * this.blocksCount) + 1;
    d(b, e)
  }
};
sk.field.FieldView.prototype.insertLine = function(a) {
  var b = this._super.insertLine.call(this, a);
  this.el.trigger("special", ["add line", b.lines]);
  if (b.collision) {
    this.gameOver()
  }
};
sk.field.FieldView.prototype.cleanLine = function() {
  this._super.cleanLine.call(this);
  this.el.trigger("special", ["clean line"])
};
sk.field.FieldView.prototype.earthquake = function() {
  var f = this.getField(),
    d, e = [];
  var h = function(m) {
    var l = true;
    for (var k = 0, j = m.length; k < j && l; k++) {
      if (m[k] == "s") {
        return true
      }
      l = (m[k] == "b")
    }
    return l
  };
  var b = function(k) {
    var j = Math.floor(Math.random() * 3),
      i;
    if (j === 0) {
      return false
    }
    if (Math.floor(Math.random() * 2) > 0) {
      i = k.slice(j).concat(k.slice(0, j))
    } else {
      i = k.slice(k.length - j).concat(k.slice(0, k.length - j))
    }
    return i
  };
  for (var g = 0, a = this.rows(); g < a; g++) {
    if (!h(f[g])) {
      d = b(f[g]);
      if (d) {
        f.splice(g, 1, d);
        e.push({
          i: g,
          r: d
        })
      }
    }
  }
  return e
};
sk.field.FieldView.prototype.bombField = function() {
  var g = [],
    f = this.getField(),
    a = [];
  var e = function(m, i) {
    var j, l;
    for (var k = -2; k < 3; k++) {
      j = m + k;
      if (f[j]) {
        for (var h = -2; h < 3; h++) {
          l = i + h;
          if (k === 0 && h === 0) {
            f[m][i] = "b";
            if (g.indexOf(m) < 0) {
              g.push(m)
            }
          } else {
            if (f[j][l]) {
              if (Math.floor(Math.random() * 4) > 0) {
                f[j][l] = "b";
                if (g.indexOf(j) < 0) {
                  g.push(j)
                }
              }
            }
          }
        }
      }
    }
  };
  for (r = 0, rCount = f.length; r < rCount; r++) {
    for (c = 0, cCount = f[r].length; c < cCount; c++) {
      if (f[r][c] == "O") {
        e(r, c)
      }
    }
  }
  for (var d = 0, b = g.length; d < b; d++) {
    a.push({
      i: g[d],
      r: f[g[d]]
    })
  }
  return a
};
sk.field.FieldView.prototype.randomClear = function() {
  var h = [],
    a = [],
    d, f, g = this.getField();
  for (var e = 0; e < 15; e++) {
    d = Math.floor(Math.random() * 20);
    f = Math.floor(Math.random() * g[d].length);
    if (g[d][f] != "b" && g[d][f] != "s") {
      this.eraseBlock(d, f);
      if (g[d][f].indexOf("#") > -1) {
        this.blocksCount--
      }
      g[d][f] = "b";
      if (h.indexOf(d) < 0) {
        h.push(d)
      }
    }
  }
  for (var e = 0, b = h.length; e < b; e++) {
    a.push({
      i: h[e],
      r: g[h[e]]
    })
  }
  return a
};
sk.field.DummyFieldView = function(a) {
  sk.field.BaseView.call(this, a);
  this.fontSize = 10;
  this._super = sk.field.BaseView.prototype
};
sk.field.DummyFieldView.prototype = new sk.field.BaseView();
sk.field.DummyFieldView.prototype.constructor = sk.field.DummyFieldView;
sk.field.DummyFieldView.prototype.checkLines = function() {
  var a = this._super.checkLines.call(this).c;
  if (a > 0) {
    this.refresh()
  }
};
sk.field.DummyFieldView.prototype.insertSpecials = function(b) {
  var a = this.getField();
  a[b.row][b.col] = b.block;
  this.drawSpecial(b.row, b.col, b.block)
};
sk.field.DummyFieldView.prototype.replaceRows = function(c) {
  var d = this.getField();
  for (var b = 0, a = c.length; b < a; b++) {
    d[c[b].i] = c[b].r
  }
};
sk.controls.Keyboard = function(b) {
  var a = {
    keys: {
      dropShape: [32],
      discardSpecial: [68],
      moveDown: [40],
      moveLeft: [37],
      moveRight: [39],
      rotateLeft: [81],
      rotateRight: [38, 87],
      specialAction: [49, 50, 51, 52, 53, 54]
    }
  };
  $.extend(a, b);
  this.container = a.container;
  delete a.container;
  this.keys = a.keys;
  delete a.keys;
  this.listenerStarted = false
};
sk.controls.Keyboard.prototype.keyHandler = function(d) {
  var e = d.keyCode,
    c = this.keys,
    a = this.container,
    b;
  if (c.moveDown.indexOf(e) > -1) {
    d.preventDefault();
    d.stopPropagation();
    a.trigger("control", ["down"]);
    return
  }
  if (c.moveLeft.indexOf(e) > -1 || c.moveRight.indexOf(e) > -1) {
    d.preventDefault();
    d.stopPropagation();
    a.trigger("control", ["move", c.moveLeft.indexOf(e) > -1 ? -1 : 1]);
    return
  }
  if (c.rotateLeft.indexOf(e) > -1 || c.rotateRight.indexOf(e) > -1) {
    d.preventDefault();
    d.stopPropagation();
    this.container.trigger("control", ["rotate", c.rotateLeft.indexOf(e) > -1 ? -1 : 1]);
    return
  }
  if (c.dropShape.indexOf(e) > -1) {
    d.preventDefault();
    d.stopPropagation();
    a.trigger("control", ["drop"]);
    return
  }
  if (c.discardSpecial.indexOf(e) > -1) {
    d.preventDefault();
    d.stopPropagation();
    a.trigger("control", ["discard"]);
    return
  }
  b = c.specialAction.indexOf(e);
  if (b > -1) {
    d.preventDefault();
    d.stopPropagation();
    this.container.trigger("control", ["special action", (b === 0) ? user.id : $('.field-container[data-opponent="' + b + '"]').attr("opponent-id")]);
    return
  }
};
sk.controls.Keyboard.prototype.startListener = function(a) {
  var a = $(a || document);
  if (!this.listenerStarted) {
    this.listenerStarted = true;
    this.keyListener = $.proxy(this.keyHandler, this);
    a.bind("keydown", this.keyListener)
  }
};
sk.controls.Keyboard.prototype.stopListener = function(a) {
  var a = $(a || document);
  if (this.listenerStarted) {
    a.unbind("keydown", this.keyListener);
    this.listenerStarted = false
  }
};
var ChatBox = {
  init: function(b, a) {
    this.box = b;
    this.input = a;
    this.initListeners()
  },
  userTo: function(h, g, f, a) {
    var a = a || "#ee2222",
      e = '<span style="color:' + a + '; font-weight: bold;">' + h + " </span>",
      d = '<span style="color:' + a + '; font-weight: bold;">' + g + "</span>",
      b = '<span style="color:' + a + ';">' + f + " " + locales.to + " </span>",
      c = e + " " + b + " " + d;
    this.msg(c)
  },
  userMsg: function(a, e, d, c) {
    var d = d || "#3333aa",
      c = c || "#3333aa",
      b;
    b = '<span style="color:' + d + '">' + a + ': </span><span style="color:' + c + '">' + escapeHtml(e) + "</span>";
    this.msg(b)
  },
  obsMsg: function(a, b) {
    this.msg('<span style="color:#666;font-style:italic;">' + a + ": " + escapeHtml(b) + "</span>")
  },
  msg: function(b) {
    var a = $("<li>" + b + "</li>").sanitizeHTML();
    this.box.append(a)
  },
  initListeners: function() {
    this.input.bind("focus", $.proxy(this.initKeysListener, this));
    this.input.bind("blur", $.proxy(this.stopKeysListener, this))
  },
  initKeysListener: function() {
    this.input.parent().removeClass("disabled");
    this.keyListener = $.proxy(this.keyHandler, this);
    $(document).bind("keydown", this.keyListener)
  },
  stopKeysListener: function() {
    this.input.parent().addClass("disabled");
    $(document).unbind("keydown", this.keyListener)
  },
  keyHandler: function(a) {
    var b = a.keyCode,
      c = this.input.val();
    if (b === 116) {
      a.preventDefault();
      a.stopPropagation();
      return
    }
    if (b == 27 || b == 9) {
      a.preventDefault();
      a.stopPropagation();
      this.input.blur();
      return
    }
    if (b == 13 && c != "") {
      if (user.isPlayer) {
        this.userMsg(user.firstName, c);
        sk.App.Comm.emit("msg", {
          id: user.id,
          t: c
        })
      } else {
        this.obsMsg(user.firstName, c);
        sk.App.Comm.emit("obsmsg", {
          id: user.id,
          t: c
        })
      }
      this.input.val("")
    }
  }
};
sk.Shapes = function() {
  var a = [{
    id: 0,
    color: {
      f: "#C10707",
      m: "#BC3E3E"
    },
    pos: [{
      pivot: [0, 1],
      arr: [
        [1, 1, 1, 1]
      ]
    }, {
      pivot: [1, 0],
      arr: [
        [1],
        [1],
        [1],
        [1]
      ]
    }]
  }, {
    id: 1,
    color: {
      f: "#0000cc",
      m: "#3333cc"
    },
    pos: [{
      pivot: [1, 1],
      arr: [
        [0, 1, 0],
        [1, 1, 1]
      ]
    }, {
      pivot: [1, 0],
      arr: [
        [1, 0],
        [1, 1],
        [1, 0]
      ]
    }, {
      pivot: [0, 1],
      arr: [
        [1, 1, 1],
        [0, 1, 0]
      ]
    }, {
      pivot: [1, 1],
      arr: [
        [0, 1],
        [1, 1],
        [0, 1]
      ]
    }]
  }, {
    id: 2,
    color: {
      f: "#008200",
      m: "#459345"
    },
    pos: [{
      pivot: [0, 0],
      arr: [
        [1, 1],
        [1, 1]
      ]
    }]
  }, {
    id: 3,
    color: {
      f: "#E0E00D",
      m: "#eeee88"
    },
    pos: [{
      pivot: [0, 1],
      arr: [
        [0, 1, 1],
        [1, 1, 0]
      ]
    }, {
      pivot: [1, 1],
      arr: [
        [1, 0],
        [1, 1],
        [0, 1]
      ]
    }]
  }, {
    id: 4,
    color: {
      f: "#E07F00",
      m: "#DB9C4A"
    },
    pos: [{
      pivot: [0, 1],
      arr: [
        [1, 1, 0],
        [0, 1, 1]
      ]
    }, {
      pivot: [1, 1],
      arr: [
        [0, 1],
        [1, 1],
        [1, 0]
      ]
    }]
  }, {
    id: 5,
    color: {
      f: "#05C4C1",
      m: "#5FC6C5"
    },
    pos: [{
      pivot: [0, 1],
      arr: [
        [1, 1, 1],
        [1, 0, 0]
      ]
    }, {
      pivot: [1, 1],
      arr: [
        [1, 1],
        [0, 1],
        [0, 1]
      ]
    }, {
      pivot: [1, 1],
      arr: [
        [0, 0, 1],
        [1, 1, 1]
      ]
    }, {
      pivot: [1, 0],
      arr: [
        [1, 0],
        [1, 0],
        [1, 1]
      ]
    }]
  }, {
    id: 6,
    color: {
      f: "#9500CC",
      m: "#A640CE"
    },
    pos: [{
      pivot: [0, 1],
      arr: [
        [1, 1, 1],
        [0, 0, 1]
      ]
    }, {
      pivot: [1, 1],
      arr: [
        [0, 1],
        [0, 1],
        [1, 1]
      ]
    }, {
      pivot: [1, 1],
      arr: [
        [1, 0, 0],
        [1, 1, 1]
      ]
    }, {
      pivot: [1, 0],
      arr: [
        [1, 1],
        [1, 0],
        [1, 0]
      ]
    }]
  }];
  return new function() {
    this.shapesCount = a.length;
    this.getShape = function(b) {
      return $.extend({}, a[b])
    };
    this.randomShape = function() {
      return Math.floor(Math.random() * this.shapesCount)
    }
  }()
}();
