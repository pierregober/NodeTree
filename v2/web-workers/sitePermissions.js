var allSites = [];
var allSitesPermissions = [];
var workerValues = {};
//make shorter pierre
var worker = new Worker(
  "https://intelshare.intelink.gov/sites/imef/imo/StarterSite/SiteAssets/ims/worker.js"
);

function initGetSubsite() {
  var siteurl = _spPageContextInfo.siteAbsoluteUrl;
  $.ajax({
    url: siteurl + "/_api/web/webinfos?$select=ServerRelativeUrl,Title",
    method: "GET",
    headers: {
      Accept: "application/json; odata=verbose",
      "content-type": "application/json; odata=verbose",
      "X-RequestDigest": $("#__REQUESTDIGEST").val(),
    },
    success: function (data) {
      console.log("data before the workers:", data);
      //add addEventListener to worker
      worker.addEventListener("message", function (e) {});
      data.d.results.map(function (props) {
        //push the parent to the collector
        allSites.push(props);
        workerGetSubSites(props);
      });
      //getPermissions();
    },
    error: function (error) {
      console.log("Error retrieving UsageLog: " + JSON.stringify(error));
    },
  });
}
initGetSubsite();

function workerGetSubSites(props) {
  //spawn a worker
  workerValues.requestDigest = $("#__REQUESTDIGEST").val();
  workerValues.url = props.ServerRelativeUrl;
  worker.postMessage(workerValues);
  //get worker results
  worker.onmessage = function (e) {
    console.log("heres the event:", e.data, "\n allsites: ", allSites);
    //get rid of empty arrays
    if (e.data.length > 0) {
      //break down an array for the collector
      if (e.data.length >= 1) {
        e.data.forEach(function (site) {
          //add parent to collector
          allSites.push(site);
          //spawn new worker
          workerValues.requestDigest = $("#__REQUESTDIGEST").val();
          workerValues.url = site.ServerRelativeUrl;
          worker.postMessage(workerValues);
        });
      } else {
        allSites.push(e.data);
      }
    }
  };
}
function getPermissions() {
  allSites.map(function (props, index) {
    var siteKey = props.ServerRelativeUrl.toLowerCase();
    $.ajax({
      url:
        "https://intelshare.intelink.gov" +
        props.ServerRelativeUrl +
        "/_api/Web/RoleAssignments?$expand=Member/Users,RoleDefinitionBindings",
      method: "GET",
      headers: {
        Accept: "application/json; odata=verbose",
        "content-type": "application/json; odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
      },
      success: function (data) {
        var obj = {};
        obj[siteKey] = data.d.results;
        allSitesPermissions.push(obj);
        //just testing to move to move to next function
        if (allSites.length - 1 == index) {
          allSitesPermissions = allSitesPermissions.sort();
          next();
        }
      },
      error: function (error) {
        console.log(
          "Error retrieving site permissions: " + JSON.stringify(error)
        );
      },
    });
  });
}
function next() {
  console.log("allSites array:", allSites);
  console.log("allSitesPermissions array:", allSitesPermissions);
}
