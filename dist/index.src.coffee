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

  centerScreen = (parent, child)->
    parent.height = window.innerHeight
    paddingLeft = (parent.offsetWidth - child.offsetWidth)/2
    paddingTop = (parent.height - child.offsetHeight)/2
    if paddingTop<2||paddingLeft<2
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
      if (cnt++)>120 then resizeRes = 0#;alert 'problem detected in adjustFont Function'
    resizeFont(0)
    centerScreenFunct()




  document.head.appendChild styleHoverChar
  document.head.appendChild styleBackgroundSize

  centerScreenFunct()
  adjustFont()
  setIcon()

window.onload = init

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
    else if e.keyCode==37 then @checkCursor @cursor.x-1, null # LEFT ARROW
    else if e.keyCode==39 then @checkCursor @cursor.x+1, null # RIGHT ARROW
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
  welcomeMsg: -> @writeDelayed '\n     **** saylermorph.com v0.1 ****\n\n 64k ram system 38911 basic bytes free\n\nready.\n'
  initScreen: ->
    for y in [0...@SCREENSIZE.h]
      rowEl = document.createElement 'ul'
      for x in [0...@SCREENSIZE.w]
        cellEl = document.createElement 'li'
        cellEl.innerHTML = '&nbsp;'
        rowEl.appendChild cellEl
      @el.appendChild rowEl

  checkCursor: (x,y)->
    @cursor.blink = false
    @getCell().className = ''
    @cursor.x = x if x?
    @cursor.y = y if y?

    if @cursor.x==@SCREENSIZE.w
      @cursor.x = 0
      @cursor.y++
    else if @cursor.x==-1
      @cursor.x = @SCREENSIZE.w-1
      @cursor.y--

    if @cursor.y==@SCREENSIZE.h
      @cursor.y -= 1
      @shiftScreenUp()

    else if @cursor.y==-1
      @cursor.y = @SCREENSIZE.h-1
    @cursor.blink = true
    #@getCell().className = 'inverted'

  cmdInterpreter: (cmd)->
    interval = null
    if cmd.trim().length==0 then return true
    if cmd.split('clear').length>1
      @clearScreen()
    else if cmd.split('list').length>1
      @writeDelayed programmListing
    else if cmd.split('reset').length>1
      @clearScreen()
      @welcomeMsg()
    else if cmd.split('help').length>1
      @writeDelayed '\n\ncall 0900-drs-will-do-it\nready.\n'
    else if cmd.split('load').length>1
      @writeDelayed '\n\npress play on tape\nloading\n'
      @writeDelayed 'ready.\n'

    else if cmd.split('run').length>1
      @clearScreen()
      @writeDelayed '
        1. A robot may not injure a human being\n   or, through inaction, allow a human
        \n   being to come to harm.
        \n\n2. A robot must obey the orders given
        \n   it by human beings except where such\n   orders would conflict with the First\n   Law.
        \n\n3. A robot must protect its own
        \n   existence as long as such protection\n   does not conflict with\n   the First or Second Laws
        \n\n\n\nready.\n'
    else @writeDelayed '\n?syntax error\nready.\n'
    return true


  getCell: ->
    @el.childNodes[@cursor.y].childNodes[@cursor.x]

  getLine: ->
    lineText = ''
    for child in @el.childNodes[@cursor.y].childNodes
      char = child.innerHTML
      lineText += if char=='&nbsp;' then ' ' else char
    if @cmdInterpreter lineText.toLowerCase() then @newLine()
    @checkCursor()

  blinkCursor: ->
    if @cursor.blink then @getCell().className = 'inverted'
    else @getCell().className = ''
    @cursor.blink = !@cursor.blink

  putChar: (char)->
    @checkCursor()
    cell = @getCell()
    cell.innerHTML = char
    @checkCursor @cursor.x+1, null


  delChar: ()->
    @checkCursor @cursor.x-1, null
    cell = @getCell()
    cell.innerHTML = '&nbsp;'

  newLine: ()=>
    @checkCursor 0, @cursor.y+1
    @getCell().className = 'inverted'

  clearScreen: ->
    @getCell().className = ''
    @cursor = x:0, y:0, blink:false
    for line in @el.childNodes
      for cell in line.childNodes
        cell.innerHTML = '&nbsp;'
    @getCell().className = 'inverted'

  setColor: ->  null # TODO ???

  shiftScreenUp: ->
    len = @el.childNodes
    for child, i in @el.childNodes
      if i==@el.childNodes.length-1
        for li in child.childNodes
          li.innerHTML = "&nbsp"
        return true
      replacement = @el.childNodes[i+1].innerHTML
      original = @el.childNodes[i]
      original.innerHTML = replacement

  textToWriteDelayed: ""

  writeDelayed: (text)-> @textToWriteDelayed += text

  nextDelayedText: ()->
    @write @textToWriteDelayed[0]
    @textToWriteDelayed = @textToWriteDelayed.substring 1, @textToWriteDelayed.length

  write: (text)-> # TODO implement \0 - \f \! codes \fore /background foreground and inverted
    for char in text
      if char=='\n' then @newLine()
      else
        @putChar if char==' ' then char = '&nbsp;' else char

  cycle: =>
    if (@time++)%35==0 then @blinkCursor()
    if @textToWriteDelayed.length>0 then @nextDelayedText()
    requestAnimationFrame @cycle


programmListing =
  '0   "----- DISK LISTING ----"    1\n'+
  '6   "HELP"                       PRG\n'+
  '12  "DRAW"                       PRG\n'+
  '1   "ROBOT RULES"                PRG\n'+
  '1   "ROBOT RULES"                PRG\n'+
  '5   "CONTACT"                    PRG\n'+
  '512 BLOCKS FREE.\n'+
  'READY.\n'
