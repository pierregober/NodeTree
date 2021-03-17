if (window.Worker) {
  self.addEventListener("message", function (e) {
    self.postMessage(e.data + " polo");
  });
} else {
  console.log("Your browser doesn't support web workers.");
}
