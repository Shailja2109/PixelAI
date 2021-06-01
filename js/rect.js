function Rect(rect) {
  if (rect === undefined) {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
  } else {
    this.x = rect.x;
    this.y = rect.y;
    this.width = rect.width;
    this.height = rect.height;
  }
}
Rect.prototype.constructor = Rect;
Rect.prototype.clone = function () {
  return new Rect(this);
};
Rect.prototype.left = function () {
  return this.x;
};
Rect.prototype.right = function () {
  return this.x + this.width - 1;
};
Rect.prototype.top = function () {
  return this.y;
};
Rect.prototype.bottom = function () {
  return this.y + this.height - 1;
};
Rect.prototype.adjust = function (dx1, dy1, dx2, dy2) {
  this.setLeft(this.left() + dx1);
  this.setTop(this.top() + dy1);
  this.setRight(this.right() + dx2);
  this.setBottom(this.bottom() + dy2);
};
Rect.prototype.unite = function (rect) {
  if (rect.isEmpty()) return;
  if (this.isEmpty()) {
    this.x = rect.x;
    this.y = rect.y;
    this.width = rect.width;
    this.height = rect.height;
    return;
  }
  var x1 = Math.min(this.left(), rect.left());
  var y1 = Math.min(this.top(), rect.top());
  var x2 = Math.max(this.right(), rect.right());
  var y2 = Math.max(this.bottom(), rect.bottom());
  this.x = x1;
  this.y = y1;
  this.width = x2 - x1 + 1;
  this.height = y2 - y1 + 1;
};
Rect.prototype.normalize = function () {
  var x2 = this.right();
  if (x2 < this.x - 1) {
    this.x = x2;
    this.width = Math.abs(this.width);
  }
  var y2 = this.bottom();
  if (y2 < this.y - 1) {
    this.y = y2;
    this.height = Math.abs(this.height);
  }
};
Rect.prototype.contains = function (point) {
  if (
    point.x >= this.left() &&
    point.x <= this.right() &&
    point.y >= this.top() &&
    point.y <= this.bottom()
  )
    return true;
  else return false;
};
Rect.prototype.isEmpty = function () {
  if (this.width == 0 || this.height == 0) return true;
  else return false;
};
Rect.prototype.setLeft = function (pos) {
  var diff = pos - this.x;
  this.x += diff;
  this.width -= diff;
};
Rect.prototype.setRight = function (pos) {
  this.width = pos - this.x + 1;
};
Rect.prototype.setTop = function (pos) {
  var diff = pos - this.y;
  this.y += diff;
  this.height -= diff;
};
Rect.prototype.setBottom = function (pos) {
  this.height = pos - this.y + 1;
};
Rect.prototype.setTopLeft = function (point) {
  this.setLeft(point.x);
  this.setTop(point.y);
};
Rect.prototype.setTopRight = function (point) {
  this.setRight(point.x);
  this.setTop(point.y);
};
Rect.prototype.setBottomLeft = function (point) {
  this.setLeft(point.x);
  this.setBottom(point.y);
};
Rect.prototype.setBottomRight = function (point) {
  this.setRight(point.x);
  this.setBottom(point.y);
};
Rect.prototype.translate = function (dx, dy) {
  this.x += dx;
  this.y += dy;
};
Rect.prototype.topLeft = function () {
  return { x: this.left(), y: this.top() };
};
Rect.prototype.topRight = function () {
  return { x: this.right(), y: this.top() };
};
Rect.prototype.bottomLeft = function () {
  return { x: this.left(), y: this.bottom() };
};
Rect.prototype.bottomRight = function () {
  return { x: this.right(), y: this.bottom() };
};
Rect.prototype.center = function () {
  return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
};
Rect.prototype.moveCenter = function (pos) {
  var cntr = this.center();
  this.translate(pos.x - cntr.x, pos.y - cntr.y);
};
function calcBoundingRect(points) {
  var rect = new Rect();
  if (points.length < 2) return rect;
  var left = points[0][0];
  var right = points[0][0];
  var top = points[0][1];
  var bottom = points[0][1];
  for (var i = 1; i < points.length; i++) {
    var x = points[i][0];
    var y = points[i][1];
    left = Math.min(x, left);
    right = Math.max(x, right);
    top = Math.min(y, top);
    bottom = Math.max(y, bottom);
  }
  rect.x = left;
  rect.y = top;
  rect.width = right - left;
  rect.height = bottom - top;
  return rect;
}
function pointToRect(point, sz) {
  var rect = new Rect();
  rect.x = point[0];
  rect.y = point[1];
  rect.adjust(-sz, -sz, +sz, +sz);
  return rect;
}
