//******************************************************************************
//***************      Classification: UNCLASSFIED       ***********************
/*******************************************************************************
    Author: Pierre Gober, 2021
    Section: IMEF IMO
    Version: 1.0 April 7, 2021
    -----------------------------------------------------------------------
    Description: Requests site hierarchy with permissions data via web
    workers (to allow multithreading) using REST calls to the SharePoint
    API. Recursively searches and calls for additional subsites dynamically.
    -----------------------------------------------------------------------
    Comments: A timer is used in place of promises. Issue of knowing when to
    initialize the reformatter function. Should revisit for possible ways of
    implementing that functionality.
    -----------------------------------------------------------------------
*******************************************************************************/
function getTreeData(cb) {
  // Collector for permissions
  let allSitesPermissions = [];
  let timer = null;
  var workerUrl =
    "https://intelshare.intelink.gov/sites/imef/imo/StarterSite/SiteAssets/ims/worker.js";
  var sharePointWorker = new Worker(workerUrl);

  //Step 3: Sending the array to the formatter
  function completion() {
    reduceData(cb, allSitesPermissions);
  }

  //Step 0: Post the fist message the web worker
  function firstIteration() {
    //We have two queries because we will need the site permission and the
    //personnel information.
    sharePointWorker.postMessage({
      requestDigest: document.getElementById("__REQUESTDIGEST").value,
      qs1: "/_api/web/webinfos?$select=ServerRelativeUrl,Title",
      qs2:
        "/_api/Web/RoleAssignments?$expand=Member/Users,RoleDefinitionBindings",
      url: _spPageContextInfo.siteAbsoluteUrl,
    });
  }
  firstIteration();

  sharePointWorker.onmessage = function (e) {
    //Step 1: recieve the posted message from the worker
    //Step 1a: Add site to the collector
    allSitesPermissions = allSitesPermissions.concat([
      { pathname: e.data.url, groups: e.data.permissions },
    ]);
    //Step 1b: Reset the timer to allow the another request to finish
    clearTimeout(timer);
    timer = setTimeout(completion, 300);
    //Step 2: Interate through that sites subsites (if any)
    e.data.sites.forEach(function (props) {
      sharePointWorker.postMessage({
        requestDigest: document.getElementById("__REQUESTDIGEST").value,
        qs1: "/_api/web/webinfos?$select=ServerRelativeUrl,Title",
        qs2:
          "/_api/Web/RoleAssignments?$expand=Member/Users,RoleDefinitionBindings",
        url: "https://intelshare.intelink.gov" + props.url,
      });
    });
  };
  sharePointWorker.onerror = function (e) {
    console.log("Contact Ims");
  };
}
