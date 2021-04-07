/***** Usage Logging JavaScript *************************************
    Author: Michael Mitchell, 2017
    Version: 1.0 April, 2017
    ---------------------------------------------------------------------------------
    Requirements: A list named 'UsageLog' with one text column named URL.
    Description: Records User visits to web pages where the code is embedded.  The URL
      is recorded in the UsagLog list.  The list must allow all users to write.  Each
      time a user visits a page with this code a list item is created representing one
      visit to the page.  The visiting username is recorded in the created column.  The
      list can be used for real-time usage statistics.
    ---------------------------------------------------------------------------------
    Comments:
*************************************************************************************/
//----------------------------------------------------------------------
// function logUsage()
// Writes an entry to a list named UsageLog at the root site level
// recording visit to whatever page user lands on that has this code...
// these entries are used for simple usage statistics
//----------------------------------------------------------------------
function logUsage() {
  var pathname = window.location.pathname;
  var listURL = window.location.href;
  var listname = "UsageLog";
  //Get browser type
  //Added by IMEF IMO - Pierre Gober CTR - 20210305
  var browserType = checkBrowser();
  addToUsageLog(pathname, listURL, listname, browserType);
}
function addToUsageLog(pathname, listURL, listname, browserType) {
  //-----------------------------------------------
  // --- Set data to be added
  //-----------------------------------------------
  var data = {
    __metadata: {
      type: "SP.Data.UsageLogListItem",
    },
    BrowserType: browserType,
    Title: "Page Visit",
    pathname: pathname,
  };
  //-----------------------------------------------
  // Get root site URL where UsageLog list resides
  //-----------------------------------------------
  var siteurl = _spPageContextInfo.siteAbsoluteUrl;
  //-----------------------------------------------
  // Call .ajax to add the list item
  //-----------------------------------------------
  $.ajax({
    url: siteurl + "/_api/web/lists/getbytitle('UsageLog')/items",
    method: "POST",
    data: JSON.stringify(data),
    headers: {
      Accept: "application/json; odata=verbose",
      "content-type": "application/json; odata=verbose",
      "X-RequestDigest": $("#__REQUESTDIGEST").val(),
    },
    success: function (data) {
      console.log("Item added successfully");
    },
    error: function (error) {
      console.log("Error: " + JSON.stringify(error));
      console.log(pathname);
    },
  });
}
//--------------function addTo UsageLog END
function checkBrowser() {
  var browser = "";
  // Get the user-agent string
  var userAgentString = navigator.userAgent;
  // Detect Broswer
  if (userAgentString.indexOf("Chrome") > -1) {
    browser = "Chrome";
    var chrome = true;
  }
  if (
    userAgentString.indexOf("MSIE") > -1 ||
    userAgentString.indexOf("rv:") > -1
  ) {
    browser = "IE";
  }
  if (userAgentString.indexOf("Firefox") > -1) {
    browser = "Firefox";
  }
  if (userAgentString.indexOf("Safari") > -1) {
    browser = "Safari";
    var safari = true;
  }
  // Discard Safari since it also matches Chrome
  if (chrome && safari) {
    browser = "Chrome";
  }
  if (userAgentString.indexOf("OP") > -1) {
    browser = "Opera";
    var opera = true;
  }
  // Discard Chrome since it also matches Opera
  if (chrome && opera) {
    browser = "Opera";
  }
  return browser;
}
