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
