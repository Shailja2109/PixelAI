/*
Utility functions
*/

// Make url using ip & port and add queries.
function getUrl() {
  var query = window.location.pathname.split("/");
  return "/editor/" + query[2] + "/" + query[3];
}

// options : method, url, request, body
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method, options.url);
    if (options.headers) {
      Object.keys(options.headers).forEach(function (key) {
        xhr.setRequestHeader(key, options.headers[key]);
      });
    }
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.responseText);
      } else {
        reject({ status: this.status, statusText: xhr.statusText });
      }
    };
    xhr.onerror = function () {
      reject({ status: this.status, statusText: xhr.statusText });
    };
    xhr.send(options.body);
  });
}

// load image in canvas
function loadImage(url) {
  url = "images/192.jpg";
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject();
    };
    image.src = url;
  });
}
