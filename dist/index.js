(function() {
  var Textmode, centerScreen, init,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    var lastTime, vendors, x;
    lastTime = 0;
    vendors = ['ms', 'moz', 'webkit', 'o'];
    x = 0;
    while (x < vendors.length && !window.requestAnimationFrame) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
      ++x;
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback, element) {
        var currTime, id, timeToCall;
        currTime = (new Date).getTime();
        timeToCall = Math.max(0, 16 - (currTime - lastTime));
        id = window.setTimeout((function() {
          callback(currTime + timeToCall);
        }), timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
    }
  })();

  Textmode = (function() {
    function Textmode(textEl) {
      this.cycle = bind(this.cycle, this);
      this.newLine = bind(this.newLine, this);
      this.keypress = bind(this.keypress, this);
      this.keydown = bind(this.keydown, this);
      this.el = textEl;
      this.initScreen();
      this.welcomeMsg();
      window.addEventListener('keydown', this.keydown);
      window.addEventListener('keypress', this.keypress);
      requestAnimationFrame(this.cycle);
    }

    Textmode.prototype.SCREENSIZE = {
      w: 40,
      h: 25
    };

    Textmode.prototype.time = 0;

    Textmode.prototype.cursor = {
      x: 0,
      y: 0,
      blink: true
    };

    Textmode.prototype.keydown = function(e) {
      console.log(e);
      if (e.keyCode === 8) {
        e.preventDefault();
        this.delChar();
        return false;
      }
      if (e.ctrlKey && e.shiftKey) {
        return this.switchCaps();
      } else if (e.keyCode === 37) {
        return this.checkCursor(this.cursor.x - 1);
      } else if (e.keyCode === 39) {
        return this.checkCursor(this.cursor.x + 1);
      } else if (e.keyCode === 40) {
        return this.checkCursor(null, this.cursor.y + 1);
      } else if (e.keyCode === 38) {
        return this.checkCursor(null, this.cursor.y - 1);
      }
    };

    Textmode.prototype.keypress = function(e) {
      if (e.keyCode === 13) {
        return this.newLine();
      } else if (e.keyCode === 32) {
        return this.placeChar('&nbsp');
      } else {
        return this.placeChar(String.fromCharCode(e.keyCode));
      }
    };

    Textmode.prototype.switchCaps = function() {
      return this.el.className = this.el.className !== 'capsMode' ? 'capsMode' : '';
    };

    Textmode.prototype.welcomeMsg = function() {
      this.write('\n');
      this.write('  **** saylermorph 64 basic v0.1 ****\n');
      this.write('\n');
      this.write(' 64k ram system 38911 basic bytes free\n');
      return this.write('ready.\n');
    };

    Textmode.prototype.initScreen = function() {
      var cellEl, i, j, ref, ref1, results, rowEl, x, y;
      results = [];
      for (y = i = 0, ref = this.SCREENSIZE.h; 0 <= ref ? i < ref : i > ref; y = 0 <= ref ? ++i : --i) {
        rowEl = document.createElement('ul');
        for (x = j = 0, ref1 = this.SCREENSIZE.w; 0 <= ref1 ? j < ref1 : j > ref1; x = 0 <= ref1 ? ++j : --j) {
          cellEl = document.createElement('li');
          cellEl.innerHTML = '&nbsp';
          rowEl.appendChild(cellEl);
        }
        results.push(this.el.appendChild(rowEl));
      }
      return results;
    };

    Textmode.prototype.checkCursor = function(x, y) {
      this.getCell().className = '';
      if (x != null) {
        this.cursor.x = x;
      }
      if (y != null) {
        this.cursor.y = y;
      }
      if (this.cursor.x === this.SCREENSIZE.w) {
        this.cursor.x = 0;
        this.cursor.y++;
      } else if (this.cursor.x === -1) {
        this.cursor.x = this.SCREENSIZE.w - 1;
        this.cursor.y--;
      }
      if (this.cursor.y === this.SCREENSIZE.h) {
        this.cursor.y = 0;
      } else if (this.cursor.y === -1) {
        this.cursor.y = this.SCREENSIZE.h - 1;
      }
      return this.getCell().className = 'inverted';
    };

    Textmode.prototype.getCell = function() {
      return this.el.childNodes[this.cursor.y].childNodes[this.cursor.x];
    };

    Textmode.prototype.blinkCursor = function() {
      if (this.cursor.blink) {
        this.getCell().className = 'inverted';
      } else {
        this.getCell().className = '';
      }
      return this.cursor.blink = !this.cursor.blink;
    };

    Textmode.prototype.placeChar = function(char) {
      this.getCell().innerHTML = char;
      return this.checkCursor(this.cursor.x + 1);
    };

    Textmode.prototype.delChar = function() {
      this.checkCursor(this.cursor.x - 1);
      return this.getCell().innerHTML = '&nbsp';
    };

    Textmode.prototype.newLine = function() {
      this.checkCursor(0, this.cursor.y + 1);
      return this.getCell().className = 'inverted';
    };

    Textmode.prototype.write = function(text) {
      var char, i, len, results;
      results = [];
      for (i = 0, len = text.length; i < len; i++) {
        char = text[i];
        if (char === '\n') {
          this.newLine();
        } else if (char === ' ') {
          char = '&nbsp';
        }
        results.push(this.placeChar(char));
      }
      return results;
    };

    Textmode.prototype.cycle = function() {
      if ((this.time++) % 35 === 0) {
        this.blinkCursor();
      }
      return requestAnimationFrame(this.cycle);
    };

    return Textmode;

  })();

  centerScreen = function(parent, child) {
    var paddingLeft, paddingTop;
    parent.height = window.innerHeight;
    paddingLeft = (parent.offsetWidth - child.offsetWidth) / 2;
    paddingTop = (parent.height - child.offsetHeight) / 2;
    return parent.style.padding = paddingTop + 'px ' + paddingLeft + 'px';
  };

  init = function() {
    var centerScreenFunct, screenEl, screenWrapEl, tm;
    screenEl = document.getElementById('textmode_screen');
    screenWrapEl = document.getElementById('textmode_wrap');
    tm = new Textmode(screenEl);
    centerScreenFunct = function() {
      return centerScreen(screenWrapEl, screenEl);
    };
    centerScreenFunct();
    return window.addEventListener('resize', centerScreenFunct);
  };

  window.onload = init;

}).call(this);

//# sourceMappingURL=index.js.map
