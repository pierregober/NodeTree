// "use strict";

function formatSites(props) {
  return {
    url: props.ServerRelativeUrl,
  };
}
function formatPermissions(props) {
  return {
    name: props.Member.Title,
    members: (props.Member.Users?.results || []).map(function (member) {
      return {
        email: member.Email,
        id: member.Id,
        isAdmin: member.IsSiteAdmin,
        title: member.Title,
      };
    }),
  };
}

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

self.addEventListener("message", function (e) {
  if (!e.data.data) {
    var promise1 = _getRequest(Object.assign(e.data, { qs: e.data.qs1 }));
    var promise2 = _getRequest(Object.assign(e.data, { qs: e.data.qs2 }));

    Promise.all([promise1, promise2])
      .then(function ([data1, data2]) {
        self.postMessage({
          permissions: data2.d.results.map(formatPermissions),
          sites: data1.d.results.map(formatSites),
          url: e.data.url,
        });
      })
      .catch(function (e) {
        console.log("Error in Promise: ", e);
      });
  }
});
