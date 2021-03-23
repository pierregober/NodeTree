// function formatUsageLog(cb) {
//   var siteurl = _spPageContextInfo.siteAbsoluteUrl;
//
//   $.ajax({
//     url:
//       siteurl +
//       "/_api/web/lists/getbytitle('UsageLog')/items?$select=pathname,Author/Title,BrowserType,Created&$expand=Author&$orderby=pathname&$top=5000",
//     method: "GET",
//     headers: {
//       Accept: "application/json; odata=verbose",
//       "content-type": "application/json; odata=verbose",
//       "X-RequestDigest": $("#__REQUESTDIGEST").val(),
//     },
//     success: function (data) {
//       var reformattedData = reduceData(data.d);
//       cb(null, reformattedData);
//     },
//     error: function (error) {
//       console.log("Error retrieving UsageLog: " + JSON.stringify(error));
//     },
//   });
// }

function reduceData(cb, data) {
  var location = "";
  var groups = [];
  var poepleCount = "";
  var root = null;
  var newArr = null;
  var masterArr = [];
  data.forEach(function (props, idx) {
    location = props.pathname;

    //check and remove the intelink.gov
    props.pathname = props.pathname.split(
      `https://intelshare.intelink.gov/sites/`
    )[1];

    //convert if a html special char is detected
    if (props.pathname.indexOf("%") > -1) {
      props.pathname = decodeURIComponent(props.pathname);
    }
    //check the last character of the pathname is "/" and removes it
    if (props.pathname.charAt(props.pathname.length - 1) === "/") {
      props.pathname = props.pathname.substring(0, props.pathname.length - 1);
    }
    //check and remove if the first char is a whack; leaving this for future cases
    if (props.pathname.charAt(0) === "/") {
      props.pathname = props.pathname.substring(1, props.pathname.length);
    }
    //lowercase the pathname + split into strings
    props.pathname = props.pathname.toLowerCase().split("/");

    //grab the groups
    groups = props.groups;

    //format the pathname
    var lastItem = "";
    newArr = props.pathname.reduce(function (acc, path, index) {
      //the inital go around
      if (acc.length === 0) {
        acc.push({ name: path, parent: null, count: 1 });
        lastItem = path;
      } else {
        //determine if it's the last entry to add the groups
        if (props.pathname.length - 1 === index) {
          acc.push({
            name: path,
            parent: lastItem,
            count: 1,
            groups: groups,
            path: location,
          });
          lastItem = path;
        } else {
          acc.push({ name: path, parent: lastItem, count: 1 });
          lastItem = path;
        }
      }
      return acc;
    }, []);

    newArr.forEach(function (newEl) {
      var matchIdx = masterArr.findIndex(
        (masterEl) =>
          masterEl.name === newEl.name && masterEl.parent === newEl.parent
      );
      if (matchIdx < 0) {
        masterArr.push(newEl);
      } else {
        masterArr[matchIdx].count = masterArr[matchIdx].count + 1;
      }
    });
  });

  createTree(masterArr);
  function createTree(arr) {
    var idMapping = arr.reduce(function (acc, el, i) {
      acc[el.name] = i;
      return acc;
    }, {});

    arr.forEach(function (el) {
      // for the first level is null aka obj
      if (typeof el.parent === "object") {
        root = el;
        delete root.parent;
        return;
      }
      // Use our mapping to locate the parent element in our data array
      var parentEl = arr[idMapping[el.parent]];
      // Add our current el to its parent's `children` array
      parentEl.children = [...(parentEl.children || []), el];
    });
  }

  //Currently the browser isn't been recorded on this dataset

  // var lastBrowserType = "";
  // var filterBrowserType = data.results.reduce(function (acc, props) {
  //   //the entries that don't have browsertype (is null) - we will omit those
  //   if (typeof props.BrowserType !== "object") {
  //     if (props.BrowserType === lastBrowserType) {
  //       //first instance of a BrowserType pair
  //       if (acc[props.BrowserType] === 1) {
  //         //example of data structure {BrowserType: 2}
  //         acc[props.BrowserType] = 2;
  //         //replace to the new number inthe interation
  //         lastBrowserType = props.BrowserType;
  //       } else {
  //         //adds 1 more to whenatever the key is
  //         acc[props.BrowserType] += 1;
  //         lastBrowserType = props.BrowserType;
  //       }
  //       //if the entry exists add one more
  //     } else if (acc[props.BrowserType] >= 1) {
  //       acc[props.BrowserType] += 1;
  //       //create the init entry and change the last type
  //     } else {
  //       lastBrowserType = props.BrowserType;
  //       acc[props.BrowserType] = 1;
  //     }
  //   }
  //   return acc;
  // }, {});
  // console.log("masterArr:", masterArr);
  // return masterArr;
  console.log("masterArr:", masterArr);
  cb(null, masterArr);
}
