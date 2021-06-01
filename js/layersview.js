function LayersView(incanvas, imgSize) {
  this.offsetChangedEvent = new Event(this);
  this.toolChangedEvent = new Event(this);
  var imageSize = imgSize;
  var canvas = incanvas;
  var canvasBoundingRect = 0;
  fitToContainer(canvas);
  var layers = [];
  var scale = 1;
  var offset = { x: 0, y: 0 };
  this.activeLayer = 0;
  this.tool = 0;
  var startScale = null;
  var startDistance = null;
  canvas.addEventListener("mousedown", mouseDown.bind(this), false);
  canvas.addEventListener("mouseup", mouseUp.bind(this), false);
  canvas.addEventListener("mousemove", mouseMove.bind(this), false);
  canvas.addEventListener("mousewheel", mouseWheel.bind(this), false);
  canvas.addEventListener("touchstart", touchStart.bind(this), false);
  canvas.addEventListener("touchend", touchEnd.bind(this), false);
  canvas.addEventListener("touchcancel", touchCancel.bind(this), false);
  canvas.addEventListener("touchmove", touchMove.bind(this), false);
  window.addEventListener("keydown", keyDown.bind(this), false);
  window.addEventListener("resize", this.resizeCanvas, false);
  this.resizeCanvas = function () {
    fitToContainer(canvas);
  };
  this.setActiveLayer = function (layer) {
    this.activeLayer = layer;
  };
  function canvas2image(canvas) {
    return {
      x: (canvas.x - offset.x) / scale,
      y: (canvas.y - offset.y) / scale,
    };
  }
  function client2canvas(clientX, clientY) {
    return {
      x: clientX - canvasBoundingRect.left,
      y: clientY - canvasBoundingRect.top,
    };
  }
  function mapToCanvas(event) {
    event.canvasX =
      (event.clientX - offset.x - canvasBoundingRect.left) / scale;
    event.canvasY = (event.clientY - offset.y - canvasBoundingRect.top) / scale;
  }
  function calcDist(event) {
    var diffX = event.touches[0].pageX - event.touches[1].pageX;
    var diffY = event.touches[0].pageY - event.touches[1].pageY;
    return Math.sqrt(diffX * diffX + diffY * diffY);
  }
  function handleTouch(event) {
    if (event.touches.length == 1) {
      event.button = 0;
      event.clientX = event.touches[0].clientX;
      event.clientY = event.touches[0].clientY;
      return true;
    }
    return false;
  }
  function touchStart(event) {
    if (handleTouch(event)) {
      mouseDown.bind(this)(event);
    } else if (event.touches.length == 2) {
      startDistance = calcDist(event);
      startScale = scale;
    }
    event.preventDefault();
  }
  function touchEnd(event) {
    if (startDistance) {
      startDistance = null;
      startScale = null;
    } else {
      mouseUp.bind(this)(event);
    }
    event.preventDefault();
  }
  function touchCancel(event) {
    touchEnd.bind(this)(event);
  }
  function touchMove(event) {
    if (startDistance) {
      var newDist = calcDist(event);
      var scale = (1 / startDistance) * newDist * startScale;
      if (!scale || Math.abs(this.startDistance - newDist) < 20) {
        event.preventDefault();
        return;
      }
      var canvasPos = client2canvas(
        (event.touches[0].pageX + event.touches[1].pageX) / 2,
        (event.touches[0].pageY + event.touches[1].pageY) / 2
      );
      this.setScale(scale, canvasPos);
    } else if (handleTouch(event)) {
      mouseMove.bind(this)(event);
    }
    event.preventDefault();
  }
  function mouseDown(event) {
    if (this.activeLayer) {
      if (this.tool) {
        mapToCanvas(event);
        this.tool.mouseDown(event);
      }
    }
  }
  function mouseMove(event) {
    if (this.activeLayer) {
      if (this.tool) {
        mapToCanvas(event);
        this.tool.mouseMove(event);
      }
    }
  }
  function mouseUp(event) {
    if (this.activeLayer) {
      if (this.tool) {
        mapToCanvas(event);
        this.tool.mouseUp(event);
      }
    }
  }
  function mouseWheel(event) {
    var canvasPos = client2canvas(event.clientX, event.clientY);
    if (event.wheelDelta / 120 > 0) {
      this.setScale(scale * scaleStep, canvasPos);
    } else {
      this.setScale(scale / scaleStep, canvasPos);
    }
    event.preventDefault();
  }
  function keyDown(event) {
    if (this.activeLayer) {
      if (this.tool) {
        this.tool.keyDown(event);
      }
    }
  }
  var scaleStep = 1.2;
  this.centerImage = function () {
    offset.x = canvas.width / 2 - (imageSize.width * scale) / 2;
    offset.y = canvas.height / 2 - (imageSize.height * scale) / 2;
    this.update();
  };
  this.setOffset = function (newOffset) {
    if (newOffset.x == offset.x && newOffset.y == offset.y) return;
    offset = newOffset;
    this.update();
    this.offsetChangedEvent.notify();
  };
  this.setScale = function (factor, canvasPos) {
    if (factor == scale) return;
    var width = canvas.width;
    var height = canvas.height;
    if (canvasPos == undefined) {
      canvasPos = { x: width / 2, y: height / 2 };
    }
    var pos1 = canvas2image(canvasPos);
    var pos2 = canvas2image(canvasPos);
    offset.x -= (pos1.x - pos2.x) * scale;
    offset.y -= (pos1.y - pos2.y) * scale;
    this.update();
  };
  this.getOffset = function () {
    return offset;
  };
  this.getScale = function () {
    return scale;
  };
  this.setTool = function (newTool) {
    this.tool = newTool;
    this.setCursor(newTool.cursor());
    this.toolChangedEvent.notify();
  };
  this.addLayer = function (layer) {
    layers.push(layer);
    layer.setView(this);
    layer.layerChangedEvent.attach(layerChanged.bind(this));
  };
  function layerChanged() {
    this.update();
  }
  this.setCursor = function (cursor) {
    canvas.style.cursor = cursor;
  };
  function fitToContainer(canvas) {
    canvasBoundingRect = canvas.getBoundingClientRect();
    canvas.width = window.innerWidth - canvasBoundingRect.left;
    canvas.height = window.innerHeight - canvasBoundingRect.top;
    canvasBoundingRect = canvas.getBoundingClientRect();
  }
  this.update = function (rect) {
    var context = canvas.getContext("2d");
    context.save();
    context.translate(offset.x, offset.y);
    context.scale(scale, scale);
    if (rect) {
      context.beginPath();
      context.rect(rect.x, rect.y, rect.width, rect.height);
      context.clearRect(rect.x, rect.y, rect.width, rect.height);
    } else {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.restore();
    }
    layers.forEach(function (layer) {
      context.globalAlpha = layer.opacity / 100.0;
      layer.render(context, rect);
      context.globalAlpha = 1.0;
    }, this);
    if (this.activeLayer) {
      if (this.tool) {
        this.tool.draw(context);
      }
    }
    context.restore();
  };
}
function MoveTool(view) {
  LayerTool.apply(this, [view]);
  this.startPoint = 0;
}
MoveTool.prototype = Object.create(LayerTool.prototype);
MoveTool.prototype.constructor = MoveTool;
MoveTool.prototype.cursor = function () {
  return "move";
};
MoveTool.prototype.mouseDown = function (event) {
  if (event.button == 0) {
    this.startPoint = { x: event.clientX, y: event.clientY };
  }
};
MoveTool.prototype.mouseMove = function (event) {
  if (this.startPoint) {
    var point = { x: event.clientX, y: event.clientY };
    var offset = this.view.getOffset();
    this.view.setOffset({
      x: offset.x + (point.x - this.startPoint.x),
      y: offset.y + (point.y - this.startPoint.y),
    });
    this.startPoint = point;
    return;
  }
};
MoveTool.prototype.mouseUp = function (event) {
  if (this.startPoint) {
    this.startPoint = 0;
  }
};
