function Editor(model, mainCanvas) {
  var self = this;
  this.model = model;
  this.btns = [];
  this.markerSlider = document.getElementById("markerSize");
  this.markerSlider.oninput = function () {
    window.editor.setLineWidth(this.value);
  };
  model.undoStack.indexChangedEvent.attach(undoIndexChanged.bind(this));
  var mainView = new LayersView(mainCanvas, model.imageSize);
  mainView.zoomChangedEvent.attach(zoomChanged.bind(this));
  mainView.toolChangedEvent.attach(toolChanged.bind(this));
  mainView.addLayer(model.layer(LayerNames.Image));
  mainView.addLayer(model.layer(LayerNames.Mask));
  mainView.addLayer(model.layer(LayerNames.Donor));
  model
    .layer(LayerNames.Mask)
    .layerChangedEvent.attach(maskOrDonorChanged.bind(this));
  model
    .layer(LayerNames.Donor)
    .layerChangedEvent.attach(maskOrDonorChanged.bind(this));
  var markerTool = new MarkerTool(this.model.undoStack, mainView);
  var lassoTool = new LassoTool(this.model.undoStack, mainView);
  var polygonTool = new PolygonTool(this.model.undoStack, mainView);
  var moveTool = new MoveTool(mainView);
  initButtons();
  undoIndexChanged();
  mainView.zoomToFit();
  mainView.setTool(markerTool);
  mainView.setActiveLayer(model.layer(LayerNames.Mask));
  function getAct(name, arg) {
    if (arg) {
      var res = this.btns.filter("[data-act=" + name + "]");
      return res.filter("[data-arg=" + arg + "]");
    } else {
      if (name) return this.btns.filter("[data-act=" + name + "]");
      else return this.btns;
    }
  }
  function undoIndexChanged() {
    setButtonEnabled("undo", self.model.undoStack.canUndo());
    setButtonEnabled("redo", self.model.undoStack.canRedo());
  }
  function setButtonEnabled(btnName, enabled) {
    var btn = getAct(btnName);
    if (enabled) {
      btn.removeClass("disabled");
    } else {
      btn.addClass("disabled");
    }
  }
  function initButtons() {
    this.btns = $("[data-act]");
    this.btns.click(function (event) {
      var act = $(this).data("act");
      if (!self[act]) return;
      var arg = $(this).data("arg");
      self[act](arg);
    });
  }
  function currentColor() {
    if (mainView.activeLayer == model.layer(LayerNames.Donor))
      return colors[DONOR];
    else return colors[MASK];
  }
  function maskOrDonorChanged() {
    setButtonEnabled("process", false);
    setButtonEnabled("clear", false);
    var mask = model.layer(LayerNames.Mask);
    var donor = model.layer(LayerNames.Donor);
    if (!mask.contentRect.isEmpty() && !donor.contentRect.isEmpty())
      setButtonEnabled("process", true);
    if (!mask.contentRect.isEmpty() || !donor.contentRect.isEmpty())
      setButtonEnabled("clear", true);
  }
  function toolChanged(view) {
    mainView.tool.setColor(currentColor());
    this.markerSlider.style.display =
      mainView.tool == markerTool ? "block" : "none";
  }
  function zoomChanged(view) {
    setButtonEnabled("zoomOut", !(mainView.getScale() <= MIN_ZOOM_FACTOR));
    setButtonEnabled("zoomIn", !(mainView.getScale() >= MAX_ZOOM_FACTOR));
  }
  this.fitToContainer = function () {
    mainView.resizeCanvas();
    self.zoomToFit();
  };
  this.downloadLowRes = function () {
    var originalCanvas = model.layer(LayerNames.Image).canvas;
    var scale = Math.min(
      600 / originalCanvas.width,
      600 / originalCanvas.height
    );
    var canvas = document.createElement("canvas");
    canvas.width = originalCanvas.width * scale;
    canvas.height = originalCanvas.height * scale;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(originalCanvas, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      function (blob) {
        saveAs(blob, "image.jpg");
      },
      "image/jpeg",
      0.95
    );
  };
  this.download = function () {
    var canvas = model.layer(LayerNames.Image).canvas;
    makeRequest({ method: "GET", url: getUrl() + "/download" })
      .then((response) => {
        canvas.toBlob(
          function (blob) {
            saveAs(blob, "image.jpg");
          },
          "image/jpeg",
          0.95
        );
      })
      .catch((err) => {
        showOrderDlg();
      });
  };
  this.zoomIn = function () {
    mainView.zoomIn();
  };
  this.zoomOut = function () {
    mainView.zoomOut();
  };
  this.zoomToOrig = function () {
    mainView.zoomToOrig();
  };
  this.zoomToFit = function () {
    mainView.zoomToFit();
  };
  this.undo = function () {
    this.model.undoStack.undo();
  };
  this.redo = function () {
    this.model.undoStack.redo();
  };
  this.clear = function () {
    this.model.clear();
    mainView.update();
  };
  this.setLineWidth = function (lineWidth) {
    markerTool.setLineWidth(lineWidth);
  };
  this.setMask = function () {
    mainView.setActiveLayer(model.layer(LayerNames.Mask));
    model.layer(LayerNames.Donor).setVisible(false);
    if (mainView.tool.color != colors[ERASE])
      mainView.tool.setColor(colors[MASK]);
  };
  this.setDonor = function () {
    mainView.setActiveLayer(model.layer(LayerNames.Donor));
    model.layer(LayerNames.Donor).setVisible(true);
    if (mainView.tool.color != colors[ERASE])
      mainView.tool.setColor(colors[DONOR]);
  };
  this.setMarker = function () {
    mainView.setTool(markerTool);
  };
  this.setLasso = function () {
    mainView.setTool(lassoTool);
  };
  this.setPolygon = function () {
    mainView.setTool(polygonTool);
  };
  this.setEraser = function () {
    mainView.setTool(markerTool);
    markerTool.setColor(colors[ERASE]);
  };
  this.setMagicWand = function () {};
  this.setMove = function () {
    mainView.setTool(moveTool);
  };
  this.setGuideLine = function () {};
  this.process = function () {
    this.model.inpaint();
  };
}
