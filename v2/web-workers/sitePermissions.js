//wrap in a iffe to avoid making globally avialable variables.
// "use strict";

function getTreeData(cb) {
  let allSitesPermissions = [];
  let resolver = {};
  let rejecter = {};

  var workerUrl =
    "https://intelshare.intelink.gov/sites/imef/imo/StarterSite/SiteAssets/ims/worker.js";
  var sharePointWorker = new Worker(workerUrl);

  function firstIteration() {
    return new Promise((resolve, reject) => {
      resolver[_spPageContextInfo.siteAbsoluteUrl] = resolve;
      rejecter[_spPageContextInfo.siteAbsoluteUrl] = reject;
      sharePointWorker.postMessage({
        requestDigest: document.getElementById("__REQUESTDIGEST").value,
        qs1: "/_api/web/webinfos?$select=ServerRelativeUrl,Title",
        qs2:
          "/_api/Web/RoleAssignments?$expand=Member/Users,RoleDefinitionBindings",
        url: _spPageContextInfo.siteAbsoluteUrl,
      });
    });
  }
  firstIteration();
  //spawn a worker
  sharePointWorker.onmessage = function (e) {
    console.log("resolver: ", resolver, "\ne.data.url: ", e.data.url);
    resolver[e.data.url]();
    allSitesPermissions = allSitesPermissions.concat([
      { pathname: e.data.url, groups: e.data.permissions },
    ]);

    e.data.sites.forEach(function (props) {
      return new Promise((resolve, reject) => {
        resolver[props.url] = resolve;
        rejecter[props.url] = reject;
        sharePointWorker.postMessage({
          requestDigest: document.getElementById("__REQUESTDIGEST").value,
          qs1: "/_api/web/webinfos?$select=ServerRelativeUrl,Title",
          qs2:
            "/_api/Web/RoleAssignments?$expand=Member/Users,RoleDefinitionBindings",
          url: "https://intelshare.intelink.gov" + props.url,
        });
      });
    });
    sharePointWorker.onerror = function (e) {
      rejecter[e.data.url]();
    };
    Promise.all(Object.values(resolver)).then(() => {
      reduceData(cb, allSitesPermissions);
    });
  };
}
