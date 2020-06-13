(function () {
  const $ = function (id) {
      return document.getElementById(id)
  }

  let canvas = this.__canvas = new fabric.Canvas('c', {
      backgroundColor: '#ffffff',
      isDrawingMode: true
  })

  fabric.Object.prototype.transparentCorners = false

  let drawingModeEl = $('drawing-mode'),
      drawingOptionsEl = $('drawing-mode-options'),
      drawingLineWidthEl = $('drawing-line-width'),
      drawingLineWidthValEl = $('drawing-line-width-value'),
      clearEl = $('clear-canvas'),
      submitEl = $('submit-button'),
      radioEls = document.querySelectorAll('.drawing-color')

  clearEl.onclick = function () {
      canvas.clear()
      let background = new fabric.Rect({
        width: 500,
        height: 500,
        fill: '#ffffff',
        selectable: false
      })
      canvas.add(background)
  }

  drawingModeEl.onclick = function () {
      canvas.isDrawingMode = !canvas.isDrawingMode
      if (canvas.isDrawingMode) {
          drawingModeEl.innerHTML = 'Enter editing mode'
          drawingOptionsEl.style.opacity = '1'
      } else {
          drawingModeEl.innerHTML = 'Enter drawing mode'
          drawingOptionsEl.style.opacity = '0.75'
      }
  }

  drawingLineWidthEl.onchange = function () {
      canvas.freeDrawingBrush.width = parseInt(this.value, 10) || 1
      drawingLineWidthValEl.innerHTML = this.value
  }

  radioEls.forEach(el => {
      el.addEventListener('change',(e) => {
        if(e.target.checked) {
          canvas.freeDrawingBrush.color = e.target.value
        }
      })
  })


  if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = '#005E7A'
      canvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.value, 10) || 1
  }

  submitEl.onclick = function () {
      console.log(canvas.toDataURL())
      submitImage(canvas.toDataURL())
  }
})()