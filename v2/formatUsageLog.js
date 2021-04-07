function reduceData(cb, data) {
  var location = "";
  var groups = [];
  var people = [];
  var root = null;
  var newArr = null;
  var masterArr = [];
  var test = null;
  console.log("data in the formatter: ", data);
  data.forEach(function (props, idx) {
    //Step 1 - Format the pathname names
    location = props.pathname;

    //Step 1a - Check and remove the intelink.gov
    props.pathname = props.pathname.split(`.gov/sites/`)[1];
    //Step 1b - Convert if a html special char is detected
    props.pathname = decodeURIComponent(props.pathname);
    //Step 1c - Check the last character of the pathname is "/" and removes it
    if (props.pathname.slice(-1) === "/") {
      props.pathname = props.pathname.substring(0, props.pathname.length - 1);
    }
    //Step 1d - Check and remove if the first char is a whack; leaving this for future cases
    if (props.pathname.slice(0, 1) === "/") {
      props.pathname = props.pathname.substring(1, props.pathname.length);
    }
    //Step 1e - Lowercase the pathname + split into strings
    props.pathname = props.pathname.toLowerCase().split("/");

    //Step 3 - Get # people in the groups, filter out by person + remove the dupes
    people = props.groups
      .reduce((a, b) => a.concat(b.members), [])
      .map((props, index, arr) => {
        props.duplicate = arr.filter((p) => p.title === props.title).length > 1;
        return props;
      });

    //Step 4 - Prep the data to get ready for the binary search algo by gettting neccesary fields
    var lastItem = "";
    newArr = props.pathname.reduce(function (acc, path, index) {
      //The inital go around because the parent is null
      if (acc.length === 0) {
        acc.push({
          name: path,
          parent: null,
          count: 1,
          groups: props.groups,
          people,
          path: location,
        });
        lastItem = path;
      } else {
        //Determine if it's the last entry to add the groups
        if (props.pathname.length - 1 === index) {
          acc.push({
            name: path,
            parent: lastItem,
            count: 1,
            groups: props.groups,
            people,
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

    //Step 5 - Gets rid of dupes and pushes the entry into a masterArr
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
  createTree(masterArr);

  //This gets the count of the broswers
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
  console.log("masterArr:", masterArr[0]);
  cb(null, masterArr[0]);
}
