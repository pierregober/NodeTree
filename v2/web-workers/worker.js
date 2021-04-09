/*******************************************************************************
*****************      Classification: UNCLASSIFIED       **********************
********************************************************************************
    Author: Pierre Gober, 2021
    Section: IMEF IMO
    Version: 1.0 April 7, 2021
    -----------------------------------------------------------------------
    Description: Worker file to start a rest call to GET the site permissions
    and personnel infomation. Formats the data before posting the message to
    main script (sitePermissions.js).
    -----------------------------------------------------------------------
    Comments: Issue where the e.data was being recongized with chrome extension
    (Metamask). For now the datastructure is different. If an error occurs that
    the data coming fro the main script is undefined I would check first that
    the worker is't accepting a worker data from another application.
    -----------------------------------------------------------------------
*******************************************************************************/
//Step 2: Before information is posted back to the main script tailor the
//information to what we exactly need. (formatSites & formatPermissions funcs)
function formatSites(props) {
  return {
    url: props.ServerRelativeUrl,
  };
}
function formatPermissions(props) {
  var accessArr = props.RoleDefinitionBindings.results
    .reduce(function (r, a) {
      return r.concat([a.Name]);
    }, [])
    .sort()
    .join(", ");
  //isGroup property is a indentifier to highlight peronnel who have direct site permissions
  return {
    access: accessArr,
    isGroup: props.Member.hasOwnProperty("AllowRequestToJoinLeave")
      ? true
      : false,
    name: props.Member.Title,
    members: (props.Member.Users?.results || []).map(function (member) {
      return {
        access: accessArr,
        email: member.Email,
        groupName: props.Member.Title,
        id: member.Id,
        isAdmin: member.IsSiteAdmin,
        title: member.Title,
      };
    }),
  };
}

//Step 1: GET request to get the site or personnel data
function _getRequest(props) {
  return new Promise(function (resolve, reject) {
    fetch(props.url + props.qs, {
      method: "GET",
      headers: {
        Accept: "application/json; odata=verbose",
        "Content-type": "application/json; odata=verbose",
        "X-RequestDigest": props.requestDigest,
      },
    })
      .then(function (resp) {
        return resp.json();
      })
      .then(resolve)
      .catch(reject);
  });
}

//Step 0: Listen for message posted from main script
self.addEventListener("message", function (e) {
  //Step 0a: Stated in the comments for why the conditional statment
  if (!e.data.data) {
    var promise1 = _getRequest(Object.assign(e.data, { qs: e.data.qs1 }));
    var promise2 = _getRequest(Object.assign(e.data, { qs: e.data.qs2 }));

    Promise.all([promise1, promise2]).then(function ([data1, data2]) {
      self.postMessage({
        permissions: data2.d.results.map(formatPermissions),
        sites: data1.d.results.map(formatSites),
        url: e.data.url,
      });
    });
  }
});
