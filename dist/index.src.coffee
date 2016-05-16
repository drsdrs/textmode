# requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
# MIT license

do ->
  lastTime = 0
  vendors = [ 'ms', 'moz', 'webkit', 'o' ]
  x = 0
  while x < vendors.length and !window.requestAnimationFrame
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame']
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] or window[vendors[x] + 'CancelRequestAnimationFrame']
    ++x
  if !window.requestAnimationFrame

    window.requestAnimationFrame = (callback, element) ->
      currTime = (new Date).getTime()
      timeToCall = Math.max(0, 16 - (currTime - lastTime))
      id = window.setTimeout((->
        callback currTime + timeToCall
        return
      ), timeToCall)
      lastTime = currTime + timeToCall
      id

  if !window.cancelAnimationFrame

    window.cancelAnimationFrame = (id) ->
      clearTimeout id
      return
  return

class Textmode
  constructor: (textEl)->
    @el = textEl
    @initScreen()
    @welcomeMsg()
    window.addEventListener 'keydown', @keydown
    window.addEventListener 'keypress', @keypress
    requestAnimationFrame @cycle
  SCREENSIZE: w:40, h:25
  time: 0 # count every animation frame
  cursor: x:0, y:0, blink:true
  keydown: (e)=>
    if e.keyCode==8 # BACKSPACE
      e.preventDefault()
      @delChar()
      return false
    if e.ctrlKey && e.shiftKey then @switchCaps()
    else if e.keyCode==37 then @checkCursor @cursor.x-1 # LEFT ARROW
    else if e.keyCode==39 then @checkCursor @cursor.x+1 # RIGHT ARROW
    else if e.keyCode==40 then @checkCursor null, @cursor.y+1 # TOP ARROW
    else if e.keyCode==38 then @checkCursor null, @cursor.y-1 # BOTTOM ARROW
  keypress: (e)=>
    if e.keyCode==13 then @getLine() # ENTER
    else if (e.keyCode||e.charCode)==32 then @putChar '&nbsp;' # SPACE
    else
      charCode = if e.keyCode==0 then e.charCode else e.keyCode
      @putChar String.fromCharCode charCode
  switchCaps: ->
    @el.className = if @el.className!='capsMode' then 'capsMode' else ''
  welcomeMsg: ->
    @write '\n'
    @write '  **** saylermorph 64 basic v0.1 ****\n'
    @write '\n'
    @write ' 64k ram system 38911 basic bytes free\n'
    @write '\nready.\n'
  initScreen: ->
    for y in [0...@SCREENSIZE.h]
      rowEl = document.createElement 'ul'
      for x in [0...@SCREENSIZE.w]
        cellEl = document.createElement 'li'
        cellEl.innerHTML = '&nbsp;'
        rowEl.appendChild cellEl
      @el.appendChild rowEl

  checkCursor: (x,y)->
    @getCell().className = ''
    @cursor.x = x if x?
    @cursor.y = y if y?

    if @cursor.x==@SCREENSIZE.w
      @cursor.x = 0
      @cursor.y++
    else if @cursor.x==-1
      @cursor.x = @SCREENSIZE.w-1
      @cursor.y--

    if @cursor.y==@SCREENSIZE.h then @cursor.y = 0
    else if @cursor.y==-1 then @cursor.y = @SCREENSIZE.h-1

    @getCell().className = 'inverted'

  cmdInterpreter: (cmd)->
    interval = null
    if cmd.trim().length!=0
      if cmd.split('clear').length>1 then @clearScreen()
      else if cmd.split('reset').length>1 then @clearScreen();@welcomeMsg()
      else if cmd.split('help').length>1 then @write '\n\ncall 0900-drs-will-do-it\nready.\n'
      else if cmd.split('load').length>1 then @write '\n\npress play on tape\nloading\nready.\n'
      else if cmd.split('run').length>1
        rules = '1. A robot may not injure a human being or, through inaction, allow a human being to come to harm.\n\n2. A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.\n\n3. A robot must protect its own existence as long as such protection does not conflict with the First or Second Laws\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nready.\n'
        len = 0
        @clearScreen()
        interval = setInterval ()=>
          @write rules[len]
          if len<rules.length-1 then len++
          else clearInterval interval
        , 50
      else @write '\n\n?syntax error\nready.\n'
      return false
    else return true
  getCell: -> @el.childNodes[@cursor.y].childNodes[@cursor.x]
  getLine: ->
    lineText = ''
    for child in @el.childNodes[@cursor.y].childNodes
      char = child.innerHTML
      lineText += if char=='&nbsp;' then ' ' else char
    if @cmdInterpreter lineText.toLowerCase() then @newLine()

  blinkCursor: ->
    if @cursor.blink then @getCell().className = 'inverted'
    else @getCell().className = ''
    @cursor.blink = !@cursor.blink
  putChar: (char)->
    @getCell().innerHTML = char
    @checkCursor @cursor.x+1
  delChar: ()->
    @checkCursor @cursor.x-1
    @getCell().innerHTML = '&nbsp;'
  newLine: ()=>
    @checkCursor 0, @cursor.y+1
    @getCell().className = 'inverted'
    @cursor.x = 0
  clearScreen: ->
    @getCell().className = ''
    @cursor = x:0, y:0, blink:false
    for line in @el.childNodes
      for cell in line.childNodes
        cell.innerHTML = '&nbsp;'
    @getCell().className = 'inverted'
  setColor: ->
    @getCell().className = 'fgColor.0 bgColor.3'



  write: (text)->
    for char in text
      if char=='\n' then @newLine()
      else
        @putChar if char==' ' then char = '&nbsp;' else char

  cycle: =>
    if (@time++)%35==0 then @blinkCursor()
    requestAnimationFrame @cycle




centerScreen = (parent, child)->
  parent.height = window.innerHeight
  paddingLeft = (parent.offsetWidth - child.offsetWidth)/2
  paddingTop = (parent.height - child.offsetHeight)/2
  if paddingTop<5||paddingLeft<5
    return -1
  else if (paddingTop > child.offsetHeight/5) && (paddingLeft > child.offsetWidth/5)
    return 1
  else
    parent.style.padding = paddingTop+'px '+paddingLeft+'px'
    return 0


getStyle = (className) ->
  classes = document.styleSheets[0].rules or document.styleSheets[0].cssRules
  x = 0
  while x < classes.length
    if classes[x].selectorText == className
      return classes[x].style
    x++


init = ->
  screenEl = document.getElementById 'textmode_screen'
  screenWrapEl = document.getElementById 'textmode_wrap'
  styleHoverChar = document.createElement("style")
  styleBackgroundSize = document.createElement("style")


  tm = new Textmode screenEl



  iconPos = 0
  fontSize = 25
  activeCharCode = String.fromCharCode 0xe0a9
  activeLiEl = null
  mouseWheelHandler = (e)->
    e = window.event || e
    delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))
    iconPos += delta
    iconPos = if iconPos<0 then 95 else if iconPos>94 then 0 else iconPos
    charCodeString = "e0"+(0xa0+iconPos).toString(16)
    activeCharCode = String.fromCharCode parseInt(charCodeString, 16)
    setIcon()


  setIcon = ()->
    styleHoverChar.innerHTML =
      '#textmode_screen ul li:hover::before {\n
        content: "'+activeCharCode+'";\n
        font-size: '+fontSize+'px;\n
      }'


  centerScreenFunct = -> centerScreen screenWrapEl, screenEl




  window.addEventListener 'resize', ->
    centerScreenFunct()
    adjustFont()
    setIcon()
  screenEl.addEventListener 'mouseover', (e)->
    if e.target.tagName.toLowerCase()=='li'
      activeLiEl = e.target
  screenEl.addEventListener 'mousewheel', mouseWheelHandler
  screenEl.addEventListener 'contextmenu', (e)->
    e.preventDefault()
    activeCharCode = activeLiEl.innerHTML
    if activeCharCode=="&nbsp;" then activeCharCode = String.fromCharCode 0xa0
    setIcon()
    false
  screenEl.addEventListener 'click', ->
    if activeLiEl? then activeLiEl.innerHTML = activeCharCode

  resizeFont = (amount)->
    fontSize += amount
    screenEl.style.fontSize = (fontSize+amount)+'px'
    styleBackgroundSize.innerHTML = '#textmode_wrap::after { background-size: '+(fontSize*0.175)+'px }'

  adjustFont = ()->
    resizeRes = centerScreenFunct()
    cnt = 0
    while resizeRes!=0
      resizeRes = centerScreenFunct()
      resizeFont resizeRes
      cnt++
      if (cnt++)>120 then resizeRes = 0;alert 'problem detected in adjustFont Function'
    resizeFont(0)
    centerScreenFunct()

  adjustFont()
  setIcon()


  document.head.appendChild styleHoverChar
  document.head.appendChild styleBackgroundSize

window.onload = init
