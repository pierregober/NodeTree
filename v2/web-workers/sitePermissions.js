var allSites = [];
var allSitesPermissions = [];
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
      worker.addEventListener("message", function (e) {
        console.log(e.data);
      });
      var test = {};

      data.d.results.map(function (props) {
        test.requestDigest = $("#__REQUESTDIGEST").val();
        test.url = props.ServerRelativeUrl;
        //possible cb for data coming back
        // function cb(error, item){
        //   if(error){
        //     console.log(error)
        //   }
        // }
        worker.postMessage(test);
        //Old way
        //allSites.push(props);
        //getSubSites(props.ServerRelativeUrl, props.Title);
      });
      getPermissions();
    },
    error: function (error) {
      console.log("Error retrieving UsageLog: " + JSON.stringify(error));
    },
  });
}
initGetSubsite();

//Recursion to get subsites additonal sites
function getSubSites(SubSiteUrl, SubSiteTitle) {
  $.ajax({
    url:
      "https://intelshare.intelink.gov" +
      SubSiteUrl +
      "/_api/web/webinfos?$select=ServerRelativeUrl,Title",
    method: "GET",
    headers: {
      Accept: "application/json; odata=verbose",
    },
    success: function (subsites) {
      //get rid of empty arrays
      if (subsites.d.results.length > 0) {
        //break down an array for the collector
        if (subsites.d.results.length >= 1) {
          subsites.d.results.forEach(function (site, index) {
            allSites.push(site);
          });
        } else {
          allSites.push(subsites.d.results);
        }
      }
      subsites.d.results.map(function (props) {
        getSubSites(props.ServerRelativeUrl, props.Title);
      });
    },
    error: function (error) {
      console.log("Error retrieving subsite: " + JSON.stringify(error));
    },
  });
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
