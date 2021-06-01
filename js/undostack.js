/* File contains the functions used to undo and redo operations on canvas */

// undo and redo command - self called commands attached can be attached to variables
function GroupUndoCommand() {
  var commands = [];
  this.undo = function () {
    commands.forEach(function (command) {
      command.undo();
    }, this);
  };
  this.redo = function () {
    commands.forEach(function (command) {
      command.redo();
    }, this);
  };
  this.push = function (cmd) {
    commands.push(cmd);
  };
}

// maintain undo stack
function UndoStack(model) {
  var undoStack = [];
  var undoCursor = -1;
  this.indexChangedEvent = new Event(this);
  this.undo = function () {
    if (this.canUndo()) {
      undoStack[undoCursor].undo();
      undoCursor--;
      this.indexChangedEvent.notify();
    }
  };
  this.redo = function () {
    if (this.canRedo()) {
      undoCursor++;
      undoStack[undoCursor].redo();
      this.indexChangedEvent.notify();
    }
  };
  this.canUndo = function () {
    if (undoStack.length > 0 && undoCursor >= 0) return true;
    else return false;
  };
  this.canRedo = function () {
    if (undoStack.length > 0 && undoCursor < undoStack.length - 1) return true;
    else return false;
  };
  this.push = function (cmd) {
    undoStack.splice(undoCursor + 1);
    undoStack.push(cmd);
    this.redo();
  };
}
