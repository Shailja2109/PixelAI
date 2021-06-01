// Interface event to attach event listners
var Event = function (sender) {
  this._sender = sender;
  this._listeners = [];
};

Event.prototype = {
  attach: function (listener) {
    if (listener) this._listeners.push(listener);
  },
  detach: function (listener) {
    var index = this._listeners.indexOf(listener);
    if (index > -1) {
      this._listeners.splice(index, 1);
    }
  },
  notify: function (args) {
    this._listeners.forEach(function (listener) {
      listener(this._sender, args);
    }, this);
  },
};
