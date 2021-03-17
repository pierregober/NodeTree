function getSiteGroups() {
  var siteurl = _spPageContextInfo.siteAbsoluteUrl;

  $.ajax({
    url:
      siteurl +
      "/_api/web/getsubwebsfilteredforcurrentuser(nWebTemplateFilter=-1,nConfigurationFilter=-1)?$select=title,ServerRelativeUrl",
    method: "GET",
    headers: {
      Accept: "application/json; odata=verbose",
      "content-type": "application/json; odata=verbose",
      "X-RequestDigest": $("#__REQUESTDIGEST").val(),
    },
    success: function (data) {
      console.log("Here's your data:", data.d);
      getUsersByGroup(data);
    },
    error: function (error) {
      console.log("Error retrieving UsageLog: " + JSON.stringify(error));
    },
  });
}
getSiteGroups();
function getUsersByGroup(data) {}

//get all group permissions
//get all people related to that group
//get all sites and subsites
