function Layer(size, layerId) {
  this.layerId = layerId;
  this.layerChangedEvent = new Event(this);
  this.opacity = 100;
  this.canvas = 0;
  this.view = 0;
  this.visible = true;
  this.contentRect = new Rect();
  this.createCanvas(size.width, size.height);
}
Layer.prototype.constructor = Layer;
Layer.prototype.render = function (context, rect) {
  if (this.canvas && this.isVisible()) {
    if (rect && rect.isEmpty() == false) {
      context.drawImage(
        this.canvas,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        rect.x,
        rect.y,
        rect.width,
        rect.height
      );
    } else {
      context.drawImage(this.canvas, 0, 0);
    }
  }
};
Layer.prototype.size = function () {
  return { width: this.canvas.width, height: this.canvas.height };
};
Layer.prototype.createCanvas = function (width, height) {
  this.canvas = document.createElement("canvas");
  this.canvas.width = width;
  this.canvas.height = height;
};
Layer.prototype.isVisible = function () {
  return this.visible;
};
Layer.prototype.setVisible = function (visible) {
  this.visible = visible;
  this.view.update();
};
Layer.prototype.setOpacity = function (opacity) {
  this.opacity = opacity;
};
Layer.prototype.setView = function (newView) {
  this.view = newView;
};
Layer.prototype.drawLayer = function () {};
function LayerTool(view) {
  this.view = view;
  this.color = 0;
}
LayerTool.prototype.layer = function () {
  return this.view.activeLayer;
};
LayerTool.prototype.cursor = function () {
  return "default";
};
LayerTool.prototype.draw = function (ctx) {
  return;
};
LayerTool.prototype.setColor = function (val) {
  this.color = val;
  this.view.setCursor(this.cursor());
};
LayerTool.prototype.keyDown = function (event) {};
