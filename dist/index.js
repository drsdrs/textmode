(function() {
  // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
  // MIT license
  var Textmode, init, programmListing;

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

  init = function() {
    var activeCharCode, activeLiEl, adjustFont, centerScreen, centerScreenFunct, fontSize, getStyle, iconPos, mouseWheelHandler, resizeFont, screenEl, screenWrapEl, setIcon, styleBackgroundSize, styleHoverChar, tm;
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
    centerScreen = function(parent, child) {
      var paddingLeft, paddingTop;
      parent.height = window.innerHeight;
      paddingLeft = (parent.offsetWidth - child.offsetWidth) / 2;
      paddingTop = (parent.height - child.offsetHeight) / 2;
      if (paddingTop < 2 || paddingLeft < 2) {
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
          resizeRes = 0; //;alert 'problem detected in adjustFont Function'
        }
      }
      resizeFont(0);
      return centerScreenFunct();
    };
    document.head.appendChild(styleHoverChar);
    document.head.appendChild(styleBackgroundSize);
    centerScreenFunct();
    adjustFont();
    return setIcon();
  };

  window.onload = init;

  Textmode = (function() {
    class Textmode {
      constructor(textEl) {
        this.keydown = this.keydown.bind(this);
        this.keypress = this.keypress.bind(this);
        this.newLine = this.newLine.bind(this);
        this.cycle = this.cycle.bind(this);
        this.el = textEl;
        this.initScreen();
        this.welcomeMsg();
        window.addEventListener('keydown', this.keydown);
        window.addEventListener('keypress', this.keypress);
        requestAnimationFrame(this.cycle);
      }

      keydown(e) {
        if (e.keyCode === 8) { // BACKSPACE
          e.preventDefault();
          this.delChar();
          return false;
        }
        if (e.ctrlKey && e.shiftKey) {
          return this.switchCaps();
        } else if (e.keyCode === 37) {
          return this.checkCursor(this.cursor.x - 1, null); // LEFT ARROW
        } else if (e.keyCode === 39) {
          return this.checkCursor(this.cursor.x + 1, null); // RIGHT ARROW
        } else if (e.keyCode === 40) {
          return this.checkCursor(null, this.cursor.y + 1); // TOP ARROW
        } else if (e.keyCode === 38) {
          return this.checkCursor(null, this.cursor.y - 1); // BOTTOM ARROW
        }
      }

      keypress(e) {
        var charCode;
        if (e.keyCode === 13) {
          return this.getLine(); // ENTER
        } else if ((e.keyCode || e.charCode) === 32) {
          return this.putChar('&nbsp;'); // SPACE
        } else {
          charCode = e.keyCode === 0 ? e.charCode : e.keyCode;
          return this.putChar(String.fromCharCode(charCode));
        }
      }

      switchCaps() {
        return this.el.className = this.el.className !== 'capsMode' ? 'capsMode' : '';
      }

      welcomeMsg() {
        return this.writeDelayed('\n     **** saylermorph.com v0.1 ****\n\n 64k ram system 38911 basic bytes free\n\nready.\n');
      }

      initScreen() {
        var cellEl, j, k, ref, ref1, results, rowEl, x, y;
        results = [];
        for (y = j = 0, ref = this.SCREENSIZE.h; 0 <= ref ? j < ref : j > ref; y = 0 <= ref ? ++j : --j) {
          rowEl = document.createElement('ul');
          for (x = k = 0, ref1 = this.SCREENSIZE.w; 0 <= ref1 ? k < ref1 : k > ref1; x = 0 <= ref1 ? ++k : --k) {
            cellEl = document.createElement('li');
            cellEl.innerHTML = '&nbsp;';
            rowEl.appendChild(cellEl);
          }
          results.push(this.el.appendChild(rowEl));
        }
        return results;
      }

      checkCursor(x, y) {
        this.cursor.blink = false;
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
          this.cursor.y -= 1;
          this.shiftScreenUp();
        } else if (this.cursor.y === -1) {
          this.cursor.y = this.SCREENSIZE.h - 1;
        }
        return this.cursor.blink = true;
      }

      //@getCell().className = 'inverted'
      cmdInterpreter(cmd) {
        var interval;
        interval = null;
        if (cmd.trim().length === 0) {
          return true;
        }
        if (cmd.split('clear').length > 1) {
          this.clearScreen();
        } else if (cmd.split('list').length > 1) {
          this.writeDelayed(programmListing);
        } else if (cmd.split('reset').length > 1) {
          this.clearScreen();
          this.welcomeMsg();
        } else if (cmd.split('help').length > 1) {
          this.writeDelayed('\n\ncall 0900-drs-will-do-it\nready.\n');
        } else if (cmd.split('load').length > 1) {
          this.writeDelayed('\n\npress play on tape\nloading\n');
          this.writeDelayed('ready.\n');
        } else if (cmd.split('run').length > 1) {
          this.clearScreen();
          this.writeDelayed('1. A robot may not injure a human being\n   or, through inaction, allow a human \n   being to come to harm. \n\n2. A robot must obey the orders given \n   it by human beings except where such\n   orders would conflict with the First\n   Law. \n\n3. A robot must protect its own \n   existence as long as such protection\n   does not conflict with\n   the First or Second Laws \n\n\n\nready.\n');
        } else {
          this.writeDelayed('\n?syntax error\nready.\n');
        }
        return true;
      }

      getCell() {
        return this.el.childNodes[this.cursor.y].childNodes[this.cursor.x];
      }

      getLine() {
        var char, child, j, len1, lineText, ref;
        lineText = '';
        ref = this.el.childNodes[this.cursor.y].childNodes;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          child = ref[j];
          char = child.innerHTML;
          lineText += char === '&nbsp;' ? ' ' : char;
        }
        if (this.cmdInterpreter(lineText.toLowerCase())) {
          this.newLine();
        }
        return this.checkCursor();
      }

      blinkCursor() {
        if (this.cursor.blink) {
          this.getCell().className = 'inverted';
        } else {
          this.getCell().className = '';
        }
        return this.cursor.blink = !this.cursor.blink;
      }

      putChar(char) {
        var cell;
        this.checkCursor();
        cell = this.getCell();
        cell.innerHTML = char;
        return this.checkCursor(this.cursor.x + 1, null);
      }

      delChar() {
        var cell;
        this.checkCursor(this.cursor.x - 1, null);
        cell = this.getCell();
        return cell.innerHTML = '&nbsp;';
      }

      newLine() {
        this.checkCursor(0, this.cursor.y + 1);
        return this.getCell().className = 'inverted';
      }

      clearScreen() {
        var cell, j, k, len1, len2, line, ref, ref1;
        this.getCell().className = '';
        this.cursor = {
          x: 0,
          y: 0,
          blink: false
        };
        ref = this.el.childNodes;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          line = ref[j];
          ref1 = line.childNodes;
          for (k = 0, len2 = ref1.length; k < len2; k++) {
            cell = ref1[k];
            cell.innerHTML = '&nbsp;';
          }
        }
        return this.getCell().className = 'inverted';
      }

      setColor() {
        return null; // TODO ???
      }

      shiftScreenUp() {
        var child, i, j, k, len, len1, len2, li, original, ref, ref1, replacement;
        len = this.el.childNodes;
        ref = this.el.childNodes;
        for (i = j = 0, len1 = ref.length; j < len1; i = ++j) {
          child = ref[i];
          if (i === this.el.childNodes.length - 1) {
            ref1 = child.childNodes;
            for (k = 0, len2 = ref1.length; k < len2; k++) {
              li = ref1[k];
              li.innerHTML = "&nbsp";
            }
            return true;
          }
          replacement = this.el.childNodes[i + 1].innerHTML;
          original = this.el.childNodes[i];
          original.innerHTML = replacement;
        }
      }

      writeDelayed(text) {
        return this.textToWriteDelayed += text;
      }

      nextDelayedText() {
        this.write(this.textToWriteDelayed[0]);
        return this.textToWriteDelayed = this.textToWriteDelayed.substring(1, this.textToWriteDelayed.length);
      }

      write(text) { // TODO implement \0 - \f \! codes \fore /background foreground and inverted
        var char, j, len1, results;
        results = [];
        for (j = 0, len1 = text.length; j < len1; j++) {
          char = text[j];
          if (char === '\n') {
            results.push(this.newLine());
          } else {
            results.push(this.putChar(char === ' ' ? char = '&nbsp;' : char));
          }
        }
        return results;
      }

      cycle() {
        if ((this.time++) % 35 === 0) {
          this.blinkCursor();
        }
        if (this.textToWriteDelayed.length > 0) {
          this.nextDelayedText();
        }
        return requestAnimationFrame(this.cycle);
      }

    };

    Textmode.prototype.SCREENSIZE = {
      w: 40,
      h: 25
    };

    Textmode.prototype.time = 0; // count every animation frame

    Textmode.prototype.cursor = {
      x: 0,
      y: 0,
      blink: true
    };

    Textmode.prototype.textToWriteDelayed = "";

    return Textmode;

  }).call(this);

  programmListing = '0   "----- DISK LISTING ----"    1\n' + '6   "HELP"                       PRG\n' + '12  "DRAW"                       PRG\n' + '1   "ROBOT RULES"                PRG\n' + '1   "ROBOT RULES"                PRG\n' + '5   "CONTACT"                    PRG\n' + '512 BLOCKS FREE.\n' + 'READY.\n';

}).call(this);

//# sourceMappingURL=index.js.map
