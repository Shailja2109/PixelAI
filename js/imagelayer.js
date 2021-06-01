function ImageLayer(size, layerId) {
  Layer.apply(this, arguments);
}
ImageLayer.prototype = Object.create(Layer.prototype);
ImageLayer.prototype.constructor = ImageLayer;
ImageLayer.prototype.drawImage = function (image, rect) {
  var ctx = this.canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  if (rect) {
    ctx.drawImage(
      image,
      0,
      0,
      rect.width,
      rect.height,
      rect.x,
      rect.y,
      rect.width,
      rect.height
    );
  } else {
    ctx.drawImage(image, 0, 0);
  }
  if (this.view) this.view.update();
};
ImageLayer.prototype.setImage = function (image, rect) {
  this.drawImage(image, rect);
};
ImageLayer.prototype.setBase64Image = function (imageStr, rect) {
  var b64image = new Image();
  var self = this;
  b64image.onload = function () {
    self.drawImage(b64image, rect);
  };
  b64image.src = imageStr;
};
function ImageCommand(layer, oldImage, newImage, rect) {
  this.layer = layer;
  this.oldImage = oldImage;
  this.newImage = newImage;
  this.rect = rect;
}
ImageCommand.prototype.undo = function () {
  this.layer.setBase64Image(this.oldImage, this.rect);
};
ImageCommand.prototype.redo = function () {
  this.layer.setBase64Image(this.newImage, this.rect);
};
