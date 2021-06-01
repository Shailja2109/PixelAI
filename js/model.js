var LayerNames = { Image: "image", Mask: "mask", Donor: "donor" };
var ModelState = {
  NONE: 0,
  IMAGE_LOAD_STARTED: 1,
  IMAGE_LOAD_FINISHED: 2,
  MODEL_LOADED: 3,
  INPAINT_STARTED: 4,
  INPAINT_FINISHED: 5,
  INPAINT_TIMEOUT: 6,
};
function Model() {
  this.imageSize = null;
  this.stateChangeEvent = new Event(this);
  var layers = {};
  this.undoStack = new UndoStack(this);
  loadImage()
    .then((image) => {
      if (image.complete) {
        this.imageSize = { width: image.width, height: image.height };
        var imageLayer = new ImageLayer(this.imageSize, LayerNames.Image);
        imageLayer.setImage(image);
        var maskLayer = new ScribbleLayer(this.imageSize, LayerNames.Mask);
        var donorLayer = new DonorLayer(maskLayer, LayerNames.Donor);
        addLayer(imageLayer);
        addLayer(maskLayer);
        addLayer(donorLayer);
        this.stateChangeEvent.notify(ModelState.MODEL_LOADED);
      }
    })
    .catch((err) => {
      showMessage("Error", "Load image failed!");
    });
  function addLayer(layer) {
    layers[layer.layerId] = layer;
  }
  this.layer = function (name) {
    return layers[name];
  };
  function cropImage(image, rect) {
    var canvas = document.createElement("canvas");
    canvas.width = rect.width;
    canvas.height = rect.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height
    );
    return canvas.toDataURL();
  }
  this.createMask = function () {
    var mask = this.layer(LayerNames.Mask);
    var donor = this.layer(LayerNames.Donor);
    if (mask.contentRect.isEmpty() || donor.contentRect.isEmpty()) return null;
    var canvas = document.createElement("canvas");
    canvas.width = mask.canvas.width;
    canvas.height = mask.canvas.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(donor.canvas, 0, 0);
    ctx.drawImage(mask.canvas, 0, 0);
    var rect = new Rect(mask.contentRect);
    rect.unite(donor.contentRect);
    var maskExists = false,
      donorExists = false;
    var pic = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
    var data = pic.data;
    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 1]) {
        data[i + 1] = 255;
        donorExists = true;
      }
      data[i + 2] = 0;
      if (data[i + 0]) {
        data[i + 0] = 255;
        data[i + 1] = 0;
        data[i + 2] = 0;
        maskExists = true;
      }
    }
    ctx.putImageData(pic, rect.x, rect.y);
    if (maskExists == false || donorExists == false) return null;
    return canvas.toDataURL("image/png");
  };
  this.clear = function () {
    var group = new GroupUndoCommand();
    group.push(new ScribbleClearCommand(this.layer(LayerNames.Donor)));
    group.push(new ScribbleClearCommand(this.layer(LayerNames.Mask)));
    this.undoStack.push(group);
  };
  this.inpaint = function () {
    var mask = this.createMask();
    if (mask == null) {
      showMessage("Error", "Mask or Donor is empty!");
      return;
    }
    this.stateChangeEvent.notify(ModelState.INPAINT_STARTED);
    var data = "mask=" + encodeURIComponent(mask);
    console.log(mask);
    makeRequest({
      method: "POST",
      url: "https://theinpaint.com/editor/1562085950/FzyUXWMGk/process",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: data,
    })
      .then((response) => {
        if (response) {
          var reply = JSON.parse(response);
          var rect = new Rect(reply);
          loadImage(
            "https://theinpaint.com/editor/1562085950/FzyUXWMGk/image?" +
              new Date().getTime()
          ).then((image) => {
            var newImage = cropImage(image, rect);
            var oldImage = cropImage(this.layer(LayerNames.Image).canvas, rect);
            var group = new GroupUndoCommand();
            group.push(new ScribbleClearCommand(this.layer(LayerNames.Donor)));
            group.push(new ScribbleClearCommand(this.layer(LayerNames.Mask)));
            group.push(
              new ImageCommand(
                this.layer(LayerNames.Image),
                oldImage,
                newImage,
                rect
              )
            );
            this.undoStack.push(group);
            this.stateChangeEvent.notify(ModelState.INPAINT_FINISHED);
          });
        } else {
          showMessage(
            "Error",
            "Processing timeout, probably your image is too large. Try desktop version."
          );
        }
      })
      .catch((err) => {
        showMessage("Error", "Processing failed!");
      });
  };
}
