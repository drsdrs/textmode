# requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
# MIT license

do ->
  lastTime = 0
  vendors = [
    'ms'
    'moz'
    'webkit'
    'o'
  ]
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
    console.log e
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
    if e.keyCode==13 then @newLine() # ENTER
    else if e.keyCode==32 then @placeChar '&nbsp' # SPACE
    else
      @placeChar String.fromCharCode(e.keyCode)
  switchCaps: ->
    @el.className = if @el.className!='capsMode' then 'capsMode' else ''
  welcomeMsg: ->
    @write '\n'
    @write '  **** saylermorph 64 basic v0.1 ****\n'
    @write '\n'
    @write ' 64k ram system 38911 basic bytes free\n'
    @write 'ready.\n'
  initScreen: ->
    for y in [0...@SCREENSIZE.h]
      rowEl = document.createElement 'ul'
      for x in [0...@SCREENSIZE.w]
        cellEl = document.createElement 'li'
        cellEl.innerHTML = '&nbsp'
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

  getCell: -> @el.childNodes[@cursor.y].childNodes[@cursor.x]
  blinkCursor: ->
    if @cursor.blink then @getCell().className = 'inverted'
    else @getCell().className = ''
    @cursor.blink = !@cursor.blink
  placeChar: (char)->
    @getCell().innerHTML = char
    @checkCursor @cursor.x+1
  delChar: ()->
    @checkCursor @cursor.x-1
    @getCell().innerHTML = '&nbsp'
  newLine: ()=>
    @checkCursor 0, @cursor.y+1
    @getCell().className = 'inverted'

  write: (text)->
    for char in text
      if char=='\n' then @newLine()
      else if char==' ' then char = '&nbsp'
      @placeChar char

  cycle: =>
    if (@time++)%35==0 then @blinkCursor()
    requestAnimationFrame @cycle




centerScreen = (parent, child)->
  parent.height = window.innerHeight
  paddingLeft = (parent.offsetWidth - child.offsetWidth)/2
  paddingTop = (parent.height - child.offsetHeight)/2
  parent.style.padding = paddingTop+'px '+paddingLeft+'px'



init = ->
  screenEl = document.getElementById 'textmode_screen'
  screenWrapEl = document.getElementById 'textmode_wrap'


  tm = new Textmode screenEl


  centerScreenFunct = -> centerScreen screenWrapEl, screenEl
  centerScreenFunct()

  window.addEventListener 'resize', centerScreenFunct



window.onload = init
