//wrap in a iffe to avoid making globally avialable variables.
// "use strict";
(function () {
  var allSitesPermissions = [];
  //make shorter pierre
  var workerUrl =
    "https://intelshare.intelink.gov/sites/imef/imo/StarterSite/SiteAssets/ims/worker.js";
  var sharePointWorker = new Worker(workerUrl);

  sharePointWorker.postMessage({
    requestDigest: document.getElementById("__REQUESTDIGEST").value,
    qs1: "/_api/web/webinfos?$select=ServerRelativeUrl,Title",
    qs2:
      "/_api/Web/RoleAssignments?$expand=Member/Users,RoleDefinitionBindings",
    url: _spPageContextInfo.siteAbsoluteUrl,
  });

  //spawn a worker
  sharePointWorker.onmessage = function (e) {
    allSitesPermissions = allSitesPermissions.concat([
      { pathname: e.data.url, groups: e.data.permissions },
    ]);

    e.data.sites.forEach(function (props) {
      sharePointWorker.postMessage({
        requestDigest: document.getElementById("__REQUESTDIGEST").value,
        qs1: "/_api/web/webinfos?$select=ServerRelativeUrl,Title",
        qs2:
          "/_api/Web/RoleAssignments?$expand=Member/Users,RoleDefinitionBindings",
        url: "https://intelshare.intelink.gov" + props.url,
      });
    });
    //TESTING you must change
    //will need to format the data after the last permission makes it
    if (allSitesPermissions.length === 53) {
      console.log("allSitesPermissions:", allSitesPermissions);
      reduceData(allSitesPermissions);
    }
  };
})();
