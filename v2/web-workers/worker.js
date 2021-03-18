self.addEventListener("message", function (e) {
  //avoid accepting other workers
  if (e.data && e.data.url) {
    // self.postMessage(e.data + " test");
    //get the subsite and its childern
    // console.log(JSON.stringify(e.data));
    fetch(
      "https://intelshare.intelink.gov" +
        e.data.url +
        "/_api/web/webinfos?$select=ServerRelativeUrl,Title",
      {
        method: "GET",
        headers: {
          Accept: "application/json; odata=verbose",
          "Content-type": "application/json; odata=verbose",
          "X-RequestDigest": e.data.requestDigest,
        },
      }
    )
      .then(function (resp) {
        return resp.json();
      })
      .then(function (data) {
        var sites = data.d.results;
        self.postMessage(sites);
      })
      .catch(function (e) {
        self.postMessage(e + "test");
      });
  }
});
