var allSites = [];

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
      data.d.results.map(function (props) {
        allSites.push(props);
        getSubSites(props.ServerRelativeUrl, props.Title);
      });
      getSitePermissions();
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
    error: function (subsites) {},
    async: false,
  });
}

function getSitePermissions() {
  console.log(allSites);
}

//get all group permissions
//get all people related to that group
//get all sites and subsites
