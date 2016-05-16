(function() {
  var Textmode, centerScreen, getStyle, init,
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
      var charCode;
      if (e.keyCode === 13) {
        return this.getLine();
      } else if ((e.keyCode || e.charCode) === 32) {
        return this.putChar('&nbsp;');
      } else {
        charCode = e.keyCode === 0 ? e.charCode : e.keyCode;
        return this.putChar(String.fromCharCode(charCode));
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
      return this.write('\nready.\n');
    };

    Textmode.prototype.initScreen = function() {
      var cellEl, i, j, ref, ref1, results, rowEl, x, y;
      results = [];
      for (y = i = 0, ref = this.SCREENSIZE.h; 0 <= ref ? i < ref : i > ref; y = 0 <= ref ? ++i : --i) {
        rowEl = document.createElement('ul');
        for (x = j = 0, ref1 = this.SCREENSIZE.w; 0 <= ref1 ? j < ref1 : j > ref1; x = 0 <= ref1 ? ++j : --j) {
          cellEl = document.createElement('li');
          cellEl.innerHTML = '&nbsp;';
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

    Textmode.prototype.cmdInterpreter = function(cmd) {
      var interval, len, rules;
      interval = null;
      if (cmd.trim().length !== 0) {
        if (cmd.split('clear').length > 1) {
          this.clearScreen();
        } else if (cmd.split('reset').length > 1) {
          this.clearScreen();
          this.welcomeMsg();
        } else if (cmd.split('help').length > 1) {
          this.write('\n\ncall 0900-drs-will-do-it\nready.\n');
        } else if (cmd.split('load').length > 1) {
          this.write('\n\npress play on tape\nloading\nready.\n');
        } else if (cmd.split('run').length > 1) {
          rules = '1. A robot may not injure a human being or, through inaction, allow a human being to come to harm.\n\n2. A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.\n\n3. A robot must protect its own existence as long as such protection does not conflict with the First or Second Laws\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nready.\n';
          len = 0;
          this.clearScreen();
          interval = setInterval((function(_this) {
            return function() {
              _this.write(rules[len]);
              if (len < rules.length - 1) {
                return len++;
              } else {
                return clearInterval(interval);
              }
            };
          })(this), 50);
        } else {
          this.write('\n\n?syntax error\nready.\n');
        }
        return false;
      } else {
        return true;
      }
    };

    Textmode.prototype.getCell = function() {
      return this.el.childNodes[this.cursor.y].childNodes[this.cursor.x];
    };

    Textmode.prototype.getLine = function() {
      var char, child, i, len1, lineText, ref;
      lineText = '';
      ref = this.el.childNodes[this.cursor.y].childNodes;
      for (i = 0, len1 = ref.length; i < len1; i++) {
        child = ref[i];
        char = child.innerHTML;
        lineText += char === '&nbsp;' ? ' ' : char;
      }
      if (this.cmdInterpreter(lineText.toLowerCase())) {
        return this.newLine();
      }
    };

    Textmode.prototype.blinkCursor = function() {
      if (this.cursor.blink) {
        this.getCell().className = 'inverted';
      } else {
        this.getCell().className = '';
      }
      return this.cursor.blink = !this.cursor.blink;
    };

    Textmode.prototype.putChar = function(char) {
      this.getCell().innerHTML = char;
      return this.checkCursor(this.cursor.x + 1);
    };

    Textmode.prototype.delChar = function() {
      this.checkCursor(this.cursor.x - 1);
      return this.getCell().innerHTML = '&nbsp;';
    };

    Textmode.prototype.newLine = function() {
      this.checkCursor(0, this.cursor.y + 1);
      this.getCell().className = 'inverted';
      return this.cursor.x = 0;
    };

    Textmode.prototype.clearScreen = function() {
      var cell, i, j, len1, len2, line, ref, ref1;
      this.getCell().className = '';
      this.cursor = {
        x: 0,
        y: 0,
        blink: false
      };
      ref = this.el.childNodes;
      for (i = 0, len1 = ref.length; i < len1; i++) {
        line = ref[i];
        ref1 = line.childNodes;
        for (j = 0, len2 = ref1.length; j < len2; j++) {
          cell = ref1[j];
          cell.innerHTML = '&nbsp;';
        }
      }
      return this.getCell().className = 'inverted';
    };

    Textmode.prototype.setColor = function() {
      return this.getCell().className = 'fgColor.0 bgColor.3';
    };

    Textmode.prototype.write = function(text) {
      var char, i, len1, results;
      results = [];
      for (i = 0, len1 = text.length; i < len1; i++) {
        char = text[i];
        if (char === '\n') {
          results.push(this.newLine());
        } else {
          results.push(this.putChar(char === ' ' ? char = '&nbsp;' : char));
        }
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
    if (paddingTop < 5 || paddingLeft < 5) {
      return -1;
    } else if ((paddingTop > child.offsetHeight / 5) && (paddingLeft > child.offsetWidth / 5)) {
      return 1;
    } else {
      parent.style.padding = paddingTop + 'px ' + paddingLeft + 'px';
      return 0;
    }
  };

  getStyle = function(className) {
    var classes, x;
    classes = document.styleSheets[0].rules || document.styleSheets[0].cssRules;
    x = 0;
    while (x < classes.length) {
      if (classes[x].selectorText === className) {
        return classes[x].style;
      }
      x++;
    }
  };

  init = function() {
    var activeCharCode, activeLiEl, adjustFont, centerScreenFunct, fontSize, iconPos, mouseWheelHandler, resizeFont, screenEl, screenWrapEl, setIcon, styleBackgroundSize, styleHoverChar, tm;
    screenEl = document.getElementById('textmode_screen');
    screenWrapEl = document.getElementById('textmode_wrap');
    styleHoverChar = document.createElement("style");
    styleBackgroundSize = document.createElement("style");
    tm = new Textmode(screenEl);
    iconPos = 0;
    fontSize = 25;
    activeCharCode = String.fromCharCode(0xe0a9);
    activeLiEl = null;
    mouseWheelHandler = function(e) {
      var charCodeString, delta;
      e = window.event || e;
      delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
      iconPos += delta;
      iconPos = iconPos < 0 ? 95 : iconPos > 94 ? 0 : iconPos;
      charCodeString = "e0" + (0xa0 + iconPos).toString(16);
      activeCharCode = String.fromCharCode(parseInt(charCodeString, 16));
      return setIcon();
    };
    setIcon = function() {
      return styleHoverChar.innerHTML = '#textmode_screen ul li:hover::before {\n content: "' + activeCharCode + '";\n font-size: ' + fontSize + 'px;\n }';
    };
    centerScreenFunct = function() {
      return centerScreen(screenWrapEl, screenEl);
    };
    window.addEventListener('resize', function() {
      centerScreenFunct();
      adjustFont();
      return setIcon();
    });
    screenEl.addEventListener('mouseover', function(e) {
      if (e.target.tagName.toLowerCase() === 'li') {
        return activeLiEl = e.target;
      }
    });
    screenEl.addEventListener('mousewheel', mouseWheelHandler);
    screenEl.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      activeCharCode = activeLiEl.innerHTML;
      if (activeCharCode === "&nbsp;") {
        activeCharCode = String.fromCharCode(0xa0);
      }
      setIcon();
      return false;
    });
    screenEl.addEventListener('click', function() {
      if (activeLiEl != null) {
        return activeLiEl.innerHTML = activeCharCode;
      }
    });
    resizeFont = function(amount) {
      fontSize += amount;
      screenEl.style.fontSize = (fontSize + amount) + 'px';
      return styleBackgroundSize.innerHTML = '#textmode_wrap::after { background-size: ' + (fontSize * 0.175) + 'px }';
    };
    adjustFont = function() {
      var cnt, resizeRes;
      resizeRes = centerScreenFunct();
      cnt = 0;
      while (resizeRes !== 0) {
        resizeRes = centerScreenFunct();
        resizeFont(resizeRes);
        cnt++;
        if ((cnt++) > 120) {
          resizeRes = 0;
          alert('problem detected in adjustFont Function');
        }
      }
      resizeFont(0);
      return centerScreenFunct();
    };
    adjustFont();
    setIcon();
    document.head.appendChild(styleHoverChar);
    return document.head.appendChild(styleBackgroundSize);
  };

  window.onload = init;

}).call(this);

//# sourceMappingURL=index.js.map
