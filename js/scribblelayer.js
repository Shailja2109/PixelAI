var CLEAR = "clear";
var MARKER = "marker";
var ERASE = "erase";
var MASK = "mask";
var DONOR = "donor";
var LASSO = "lasso";
var POLYGON = "polygon";
var colors = {
  mask: "rgb(255,0,0)",
  donor: "rgb(0,255,0)",
  erase: "rgb(255,255,255)",
};

//scribble attaches layer and action -
function ScribbleCommand(layer, action) {
  this.layer = layer;
  this.action = action;
}
// reverts last action in layer added in scribble command.
ScribbleCommand.prototype.undo = function () {
  this.layer.removeAction(this.action);
};
// reverts next action in layer added in scribble command.
ScribbleCommand.prototype.redo = function () {
  this.layer.addAction(this.action);
};
// clears layer added in scribble clear command.
function ScribbleClearCommand(layer) {
  this.layer = layer;
  this.actions = layer.actions;
}
ScribbleClearCommand.prototype.undo = function (model) {
  this.layer.actions = this.actions;
  this.layer.drawLayer();
};
ScribbleClearCommand.prototype.redo = function (model) {
  this.layer.actions = [];
  this.layer.drawLayer();
};
// Add color based on donor and mask type
function ScribbleAction(color, type) {
  this.type = type;
  this.color = color;
}
// Change color according to marker type - Donor or Mask, linewidth - from slider, points - ClientX & ClientY
function MarkerAction(color, lineWidth, points) {
  ScribbleAction.apply(this, [color, MARKER]);
  this.lineWidth = lineWidth;
  this.points = points;
}
MarkerAction.prototype.constructor = MarkerAction;
MarkerAction.prototype.draw = function (ctx) {
  if (this.points.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = this.color;
  if (this.color == colors[ERASE])
    ctx.globalCompositeOperation = "destination-out";
  else ctx.globalCompositeOperation = "source-over";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = this.lineWidth;
  ctx.moveTo(this.points[0][0], this.points[0][1]);
  for (var i = 1; i < this.points.length; i++) {
    ctx.lineTo(this.points[i][0], this.points[i][1]);
  }
  ctx.stroke();
};
MarkerAction.prototype.boundingRect = function () {
  var rect = calcBoundingRect(this.points);
  if (rect.width != 0 || rect.height != 0) {
    var hr = this.lineWidth / 2 + 2;
    rect.adjust(-hr, -hr, +hr, +hr);
  }
  return rect;
};

// Marker Tool sets the tool and allows to add event listners like mousemove, mouseup and mousedown to draw mask using it.
// Takes last action and view as argument
function MarkerTool(undoStack, view) {
  LayerTool.apply(this, [view]);
  this.undoStack = undoStack;
  this.lineWidth = 30;
  this.markerAct = 0;
}
MarkerTool.prototype = Object.create(LayerTool.prototype);
MarkerTool.prototype.constructor = MarkerTool;
MarkerTool.prototype.cursor = function () {
  var canvas = document.createElement("canvas");
  canvas.width = canvas.height = this.lineWidth;
  var ctx = canvas.getContext("2d");
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  var radius = Math.round(this.lineWidth / 2);
  ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
  ctx.fillStyle = this.color;
  ctx.fill();
  return "url(" + canvas.toDataURL() + ")" + radius + " " + radius + ", auto";
};
MarkerTool.prototype.mouseMove = function (event) {
  if (!this.layer()) return;
  if (this.markerAct) {
    var point = [event.canvasX, event.canvasY];
    var lastPoint = this.markerAct.points[this.markerAct.points.length - 1];
    if (point[0] == lastPoint[0] && point[1] == lastPoint[1]) return;
    this.markerAct.points.push(point);
    var ctx = this.layer().canvas.getContext("2d");
    this.markerAct.draw(ctx);
    var rect = new Rect({
      x: lastPoint[0],
      y: lastPoint[1],
      width: lastPoint[0] - point[0],
      height: lastPoint[1] - point[1],
    });
    rect.normalize();
    this.view.update(this.markerAct.boundingRect());
  }
};
MarkerTool.prototype.mouseUp = function (event) {
  if (!this.layer()) return;
  if (!this.markerAct) return;
  var act = this.markerAct;
  this.markerAct = 0;
  this.undoStack.push(new ScribbleCommand(this.layer(), act));
};
MarkerTool.prototype.mouseDown = function (event) {
  if (!this.layer()) return;
  if (event.button == 0) {
    var point = [event.canvasX, event.canvasY];
    this.markerAct = new MarkerAction(
      this.color,
      Math.round(this.lineWidth / this.view.getScale()),
      [point]
    );
  }
};
// setLineWidth change on slider
MarkerTool.prototype.setLineWidth = function (val) {
  this.lineWidth = val;
  this.view.setCursor(this.cursor());
};
MarkerTool.prototype.draw = function (ctx) {
  return;
  if (this.markerAct) {
    this.markerAct.draw(ctx);
  }
};
// LassoAction takes color - green / red as input and makes mask using lasso tool of same color.
// Takes last action and view as argument
function LassoAction(color) {
  ScribbleAction.apply(this, [color, LASSO]);
  this.points = [];
}
LassoAction.prototype.constructor = LassoAction;
LassoAction.prototype.draw = function (ctx) {
  if (this.points.length < 2) return;
  ctx.beginPath();
  ctx.fillStyle = this.color;
  ctx.moveTo(this.points[0][0], this.points[0][1]);
  for (var i = 1; i < this.points.length; i++) {
    ctx.lineTo(this.points[i][0], this.points[i][1]);
  }
  ctx.fill();
};
LassoAction.prototype.boundingRect = function () {
  return calcBoundingRect(this.points);
};
LassoAction.prototype.clearPoints = function () {
  this.points = [];
};
LassoAction.prototype.addPoint = function (pt) {
  this.points.push([pt.x, pt.y]);
};
// Event listners are added in LassoTool to make mask on mouseup, mousemove and mousedown.
// Takes last action and view as argument
function LassoTool(undoStack, view) {
  LayerTool.apply(this, [view]);
  this.undoStack = undoStack;
  this.action = 0;
}
LassoTool.prototype = Object.create(LayerTool.prototype);
LassoTool.prototype.constructor = LassoTool;
LassoTool.prototype.mouseDown = function (event) {
  if (!this.layer()) return;
  if (event.button != 0) return;
  var point = [event.canvasX, event.canvasY];
  this.action = new LassoAction(this.color);
  this.action.points.push(point);
};
LassoTool.prototype.mouseMove = function (event) {
  if (!this.layer()) return;
  if (this.action == 0) return;
  var point = [event.canvasX, event.canvasY];
  var lastPoint = this.action.points[this.action.points.length - 1];
  if (point[0] == lastPoint[0] && point[1] == lastPoint[1]) return;
  this.action.points.push(point);
  this.view.update(this.action.boundingRect());
};
LassoTool.prototype.mouseUp = function (event) {
  if (!this.layer()) return;
  if (this.action == 0) return;
  this.undoStack.push(new ScribbleCommand(this.layer(), this.action));
  this.action = 0;
  this.view.update();
};
LassoTool.prototype.draw = function (ctx) {
  if (this.action == 0) return;
  if (this.action.points.length < 1) return;
  var points = this.action.points;
  ctx.beginPath();
  ctx.setLineDash([5 / this.view.getScale(), 5 / this.view.getScale()]);
  ctx.strokeStyle = "#000000";
  ctx.moveTo(points[0][0], points[0][1]);
  for (var i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.stroke();
};
// Polygon tool is like draw line tool to make polygon from points.
// Takes last action and view as argument.
// Added eventlistners mousemove, mouseup and mousedown to make mask
function PolygonTool(undoStack, view) {
  LassoTool.apply(this, [undoStack, view]);
  this.undoStack = undoStack;
  this.curPoint = 0;
  this.lineWidth = 1;
}
PolygonTool.prototype = Object.create(LassoTool.prototype);
PolygonTool.prototype.constructor = PolygonTool;
PolygonTool.prototype.handleRadius = function () {
  return 10 / this.view.getScale();
};
PolygonTool.prototype.keyDown = function (event) {
  if (event.keyCode == 27) {
    this.action = 0;
    this.view.update();
  }
};
PolygonTool.prototype.mouseDown = function (event) {
  if (!this.layer()) return;
  if (event.button != 0) return;
  var point = [event.canvasX, event.canvasY];
  this.curPoint = point;
  if (this.action == 0) {
    this.action = new LassoAction(this.color);
    this.action.points.push(point);
    this.view.update();
    return;
  }
  this.action.points.push(point);
  var startRect = pointToRect(this.action.points[0], this.handleRadius());
  if (startRect.contains({ x: point[0], y: point[1] })) {
    if (!this.action.boundingRect().isEmpty()) {
      this.undoStack.push(new ScribbleCommand(this.layer(), this.action));
      this.action = 0;
    }
    this.view.update();
  }
};
PolygonTool.prototype.mouseMove = function (event) {
  if (!this.layer()) return;
  if (this.action == 0) return;
  var point = [event.canvasX, event.canvasY];
  var lastPoint = this.action.points[this.action.points.length - 1];
  var rect = calcBoundingRect([lastPoint, this.curPoint]);
  this.curPoint = point;
  rect.unite(calcBoundingRect([lastPoint, this.curPoint]));
  if (!rect.isEmpty()) {
    var lw = this.lineWidth * this.view.getScale();
    rect.adjust(-lw, -lw, lw, lw);
    this.view.update(rect);
  }
};
PolygonTool.prototype.mouseUp = function (event) {};
PolygonTool.prototype.draw = function (ctx) {
  if (this.action == 0) return;
  this.action.points.push(this.curPoint);
  LassoTool.prototype.draw.call(this, ctx);
  var startPoint = this.action.points[0];
  ctx.setLineDash([]);
  ctx.lineWidth = this.lineWidth;
  ctx.beginPath();
  ctx.arc(startPoint[0], startPoint[1], this.handleRadius(), 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = "#FFF";
  ctx.stroke();
  this.action.points.pop();
};
// Scribble layer - Size of the image is set as the layer size to have mask image of same size
function ScribbleLayer(size, layerId) {
  Layer.apply(this, arguments);
  this.opacity = 50;
  this.actions = [];
}
ScribbleLayer.prototype = Object.create(Layer.prototype);
ScribbleLayer.prototype.constructor = ScribbleLayer;
ScribbleLayer.prototype.initActions = function (actions) {
  var newActions = [];
  var actions = this.actions;
  actions.forEach(function (action) {
    if (action.type == "marker")
      newActions.push(
        new MarkerAction(action.color, action.lineWidth, action.points)
      );
    else if (action.type == "clear") newAction.push(new ClearAction());
  }, this);
  this.actions = newActions;
};
ScribbleLayer.prototype.drawLayer = function () {
  var actions = this.actions;
  this.contentRect = new Rect();
  var ctx = this.canvas.getContext("2d");
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  actions.forEach(function (action) {
    if (action.color == colors[ERASE])
      ctx.globalCompositeOperation = "destination-out";
    else ctx.globalCompositeOperation = "source-over";
    action.draw(ctx);
    this.contentRect.unite(action.boundingRect());
  }, this);
  this.layerChangedEvent.notify();
  this.view.update();
};
ScribbleLayer.prototype.addAction = function (action) {
  this.actions.push(action);
  this.drawLayer();
};
ScribbleLayer.prototype.removeAction = function (action) {
  var actions = this.actions;
  var index = actions.indexOf(action);
  if (index > -1) {
    actions.splice(index, 1);
    this.drawLayer();
  }
};
ScribbleLayer.prototype.hasActions = function () {
  return this.actions.length != 0;
};
// make rect using
function inflateRect(rect, dx, dy, width, height) {
  rect.setLeft(Math.max(rect.left() - dx, 0));
  rect.setTop(Math.max(rect.top() - dy, 0));
  rect.setRight(Math.min(rect.right() + dx, width - 1));
  rect.setBottom(Math.min(rect.bottom() + dy, height - 1));
}
// if mask is changed to change the donor layer to make masks bounded within it.
function maskChanged() {
  if (this.mask.hasActions() && this.actions.length == 0) {
    this.addAction(this.action);
  }
  if (this.actions.length == 1) this.action.clearPoints();
  else return;
  var rect = this.mask.contentRect;
  if (rect.isEmpty()) {
    this.drawLayer();
    return;
  }
  var sz = this.size();
  inflateRect(rect, rect.width, rect.height / 10, sz.width, sz.height);
  this.action.addPoint(rect.topLeft());
  this.action.addPoint(rect.topRight());
  this.action.addPoint(rect.bottomRight());
  this.action.addPoint(rect.bottomLeft());
  this.drawLayer();
}
// Change the size of donor layer according to the masks
function DonorLayer(mask, layerId) {
  ScribbleLayer.apply(this, [mask.size(), layerId]);
  this.visible = false;
  this.mask = mask;
  this.action = new LassoAction(colors[DONOR]);
  this.mask.layerChangedEvent.attach(maskChanged.bind(this));
}
DonorLayer.prototype = Object.create(ScribbleLayer.prototype);
DonorLayer.prototype.constructor = DonorLayer;
