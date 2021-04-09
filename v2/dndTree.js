/*******************************************************************************
*****************      Classification: UNCLASSIFIED       **********************
********************************************************************************
    Author: Pierre Gober, 2021
    Section: IMEF IMO
    Version: 1.0 April 7, 2021
    -----------------------------------------------------------------------
    Description: The data visualized solution for a site collection that
    showcases not only the site collection hierarchical structure but the
    site permission groups for sites, personnel with direct site premissions,
    site usgage rating, count site groups and personnel who have other than
    normal access and it highlights discepencies in permission groups for
    the personnel; indicates duplicates. Also has a node tree search where you
    can search by personnel, site group or site name. It will highlight if a
    match is found. Panning and zooming feature to enhance visability of
    the tree sections.
    -----------------------------------------------------------------------
    Comments: Site assests should be in the parent site. The current
    configuration is for imef/siteAssests/ims The usage rating has not been
    configured just yet. Will come in the next verison. Vars that begin with
    a dollar sign ($example) indicates that it's a reference to a HTML DOM
    element. Not to get confused with the jQuery selector $() method. Serveral
    elements native to sharepoint are display none or removed to proper display
    the entire tree. For more information on the elements removed head to the
    app.js.
    -----------------------------------------------------------------------
*******************************************************************************/

//Define supporting scripts
var scripts = [
  "sitePermissions.js",
  "worker.js",
  "nodeTreeV2/vendors/jquery.js",
  "nodeTree/formatUsageLog.js",
  "nodeTreeV2/vendors/d3.v3.min.js",
  "nodeTreeV2/vendors/modernizr.js",
  "nodeTreeV2/vendors/placeholder.js",
  "nodeTreeV2/vendors/select2.min.js",
  "nodeTreeV2/d3-context-menu.js",
  "nodeTreeV2/foundation.min.js",
  "nodeTreeV2/foundation.alert.js",
  "nodeTreeV2/foundation.reveal.js",
];

//Define supporting links for styling
var links = [
  "nodeTreeV2/styles/select2.min.css",
  "nodeTreeV2/styles/app.css",
  "nodeTreeV2/styles/d3-context-menu.css",
];

(function () {
  //Step 0: Construct the styling
  function linkBuilder(path) {
    var link = document.createElement("link");
    link.href = _spPageContextInfo.webAbsoluteUrl + "/SiteAssets/ims/" + path;
    link.rel = "stylesheet";
    link.type = "text/css";
    document.head.appendChild(link);
    return link;
  }
  //Step 1: Load the styling
  function loadLinks() {
    links = Object.keys(
      links.reduce(function (acc, path, index) {
        acc[path] = index;
        return acc;
      }, {})
    );

    links.map(linkBuilder).map(function (link, i) {
      if (i == links.length - 1) {
        link.addEventListener("load", function () {});
      }
    });
  }
  loadLinks();

  //Step 2: Construct the dependencies
  function scriptBuilder(path) {
    var script = document.createElement("script");
    script.async = false;
    script.defer = true;
    script.src = _spPageContextInfo.webAbsoluteUrl + "/SiteAssets/ims/" + path;
    script.type = "text/javascript";
    document.body.appendChild(script);
    return script;
  }

  //Step 3: Load the dependencies
  function loadScripts() {
    scripts = Object.keys(
      scripts.reduce(function (acc, path, index) {
        acc[path] = index;
        return acc;
      }, {})
    );

    scripts.map(scriptBuilder).map(function (script, i) {
      if (i == scripts.length - 1) {
        script.addEventListener("load", function () {
          //Step 4: Initialize the tree
          createNodeTree();
        });
      }
    });
  }
  loadScripts();
})();

function createNodeTree() {
  var $select2 = null;
  var placeholderStyle = null;
  Foundation.global.namespace = "";
  //Step 5: Create the container for the tree + append to content area
  var $initTree = document.createElement("div");
  $initTree.id = "tree-container";

  //Step 6: Create search box + drop down
  var $searchContainer = document.createElement("div");
  $searchContainer.class = "search";
  var $blockContainer = document.createElement("div");
  $blockContainer.id = "block-container";
  var $searchField = document.createElement("div");
  $searchField.id = "searchName";

  var $searchClear = document.createElement("div");
  $searchClear.id = "searchClear";
  $searchClear.innerText = "Clear";

  $blockContainer.appendChild($searchField);
  $blockContainer.appendChild($searchClear);
  $searchContainer.appendChild($blockContainer);

  //Step 7: Append to the container
  var nodeTreeContainer = document.getElementById("contentBox");
  nodeTreeContainer.appendChild($searchContainer);
  nodeTreeContainer.appendChild($initTree);

  //Step 8: First initialization of the tree
  $("document").ready(function () {
    $(document).foundation();
    $(document).on("opened", "[data-reveal]", function () {
      var element = $(".inputName:visible").first();
      element.focus(function () {
        this.selectionStart = this.selectionEnd = this.value.length;
      });
      element.focus();
    });

    //Step 9: Get the tree data
    function cb(error, props) {
      if (error) {
        console.error(error);
        return;
      }
      draw_tree(null, props);
    }
    getTreeData(cb);
  });

  var tree_root;
  outer_update = null;
  outer_centerNode = null;
  var nodeTextOffset = 15;

  //adds values to the array recursively
  function select2DataCollection(d) {
    //collect the names
    if (d.children) d.children.forEach(select2DataCollection);
    //collect the groups + personnel with direct site permissions <= the
    //personnell shoudl be moved to a site group
    if (d.groups)
      d.groups.forEach(function (group, index) {
        select2Data.push(group.name);
      });
    //collect the personnel
    if (d.people) {
      d.people.forEach(function (person, index) {
        select2Data.push(person.title);
      });
    }
    //collect the node name
    select2Data.push(d.name);
  }

  function searchTree(d, first_call = false) {
    if (d.children) d.children.forEach(searchTree);
    //Search by node name, group, or people
    if (d.name) {
      if (
        d.groups.find(function (g) {
          g.name === searchText;
        }) ||
        d.name.match(searchText) ||
        d.people.find(function (p) {
          p.title === searchText;
        })
      ) {
        d.search_target = first_call;
        //Walk parent chain
        var ancestors = [];
        var parent = d;
        while (typeof parent !== "undefined") {
          ancestors.push(parent);
          parent.class = "found";
          parent = parent.parent;
        }
      }
    }
  }

  function clearAll(d) {
    d.class = "";
    if (d.children) d.children.forEach(clearAll);
    else if (d._children) d._children.forEach(clearAll);
  }

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  function collapseAllNotFound(d) {
    if (d.children) {
      if (d.class !== "found") {
        d._children = d.children;
        d._children.forEach(collapseAllNotFound);
        d.children = null;
      } else {
        d.children.forEach(collapseAllNotFound);
      }
    }
  }

  function centerSearchTarget(d) {
    if (d.search_target) {
      outer_centerNode(d);
    }
    if (d.children) {
      d.children.forEach(centerSearchTarget);
    }
  }

  function expandAll(d) {
    if (d._children) {
      d.children = d._children;
      d.children.forEach(expandAll);
      d._children = null;
    } else if (d.children) d.children.forEach(expandAll);
  }

  function close_modal() {
    $(document).foundation("reveal", "close");
  }

  function draw_tree(error, treeData) {
    //Calculate total nodes, max label length
    var totalNodes = 0;
    var maxLabelLength = 0;
    //Panning variables
    var panSpeed = 200;
    //Within 20px from edges will pan when dragging.
    var panBoundary = 20;
    //Misc. variables
    var i = 0;
    var duration = 750;
    var root;

    //Size of the diagram
    var viewerWidth = $(document).width();
    var viewerHeight = $(document).height();

    var tree = d3.layout.tree().size([viewerHeight, viewerWidth]);

    //Define a d3 diagonal projection for use by the node paths later on
    var diagonal = d3.svg.diagonal().projection(function (d) {
      return [d.y, d.x];
    });

    //A recursive helper function for performing some setup by walking through
    //all nodes
    function visit(parent, visitFn, childrenFn) {
      if (!parent) return;

      visitFn(parent);

      var children = childrenFn(parent);
      if (children) {
        var count = children.length;
        for (var i = 0; i < count; i++) {
          visit(children[i], visitFn, childrenFn);
        }
      }
    }

    //Call visit function to establish maxLabelLength
    visit(
      treeData,
      function (d) {
        totalNodes++;
        maxLabelLength = Math.max(d.name.length, maxLabelLength);
      },
      function (d) {
        return d.children && d.children.length > 0 ? d.children : null;
      }
    );

    //A method to delete sites -- later functionality
    function delete_node(node) {
      visit(
        treeData,
        function (d) {
          if (d.children) {
            for (var child of d.children) {
              if (child == node) {
                d.children = _.without(d.children, child);
                update(root);
                break;
              }
            }
          }
        },
        function (d) {
          return d.children && d.children.length > 0 ? d.children : null;
        }
      );
    }

    //Step 10: Sort the tree according to the node names
    function sortTree() {
      tree.sort(function (a, b) {
        return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
      });
    }
    sortTree();

    //Panning function
    function pan(domNode, direction) {
      var speed = panSpeed;
      if (panTimer) {
        clearTimeout(panTimer);
        translateCoords = d3.transform(svgGroup.attr("transform"));
        if (direction == "left" || direction == "right") {
          translateX =
            direction == "left"
              ? translateCoords.translate[0] + speed
              : translateCoords.translate[0] - speed;
          translateY = translateCoords.translate[1];
        } else if (direction == "up" || direction == "down") {
          translateX = translateCoords.translate[0];
          translateY =
            direction == "up"
              ? translateCoords.translate[1] + speed
              : translateCoords.translate[1] - speed;
        }
        scaleX = translateCoords.scale[0];
        scaleY = translateCoords.scale[1];
        scale = zoomListener.scale();
        svgGroup
          .transition()
          .attr(
            "transform",
            "translate(" +
              translateX +
              "," +
              translateY +
              ")scale(" +
              scale +
              ")"
          );
        d3.select(domNode)
          .select("g.node")
          .attr(
            "transform",
            "translate(" + translateX + "," + translateY + ")"
          );
        zoomListener.scale(zoomListener.scale());
        zoomListener.translate([translateX, translateY]);
        panTimer = setTimeout(function () {
          pan(domNode, speed, direction);
        }, 50);
      }
    }

    //Define the zoom function
    function zoom() {
      svgGroup.attr(
        "transform",
        "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"
      );
    }

    //Define the zoomListener which calls the zoom function on the "zoom" event
    //constrained within the scaleExtents
    var zoomListener = d3.behavior
      .zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", zoom);

    //Step 11: Adding a parent div for the hit box
    var $popover = d3
      .select("#tree-container")
      .append("div")
      .attr("id", "hitbox")
      .append("div")
      .attr("class", "node_tooltip")
      .style("opacity", 0);

    //Step 12: Define the baseSvg, attaching a class for styling and
    //the zoomListener
    var baseSvg = d3
      .select("#tree-container")
      .append("svg")
      .attr("width", viewerWidth)
      .attr("height", viewerHeight);

    baseSvg
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");

    baseSvg.call(zoomListener);

    //Helper functions for collapsing and expanding nodes.
    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    function expand(d) {
      if (d._children) {
        d.children = d._children;
        d.children.forEach(expand);
        d._children = null;
      }
    }

    var overCircle = function (d) {
      selectedNode = d;
      updateTempConnector();
    };
    var outCircle = function (d) {
      selectedNode = null;
      updateTempConnector();
    };

    //Step 13: Color the node + if found different color for node
    function colorNode(d) {
      result = "#777";
      if (d.class === "found") result = "#3949ab"; //Standard IMS base color
      return result;
    }

    //Function to center node when clicked/dropped so node doesn't get lost
    //when collapsing/moving with large amount of children
    function centerNode(source) {
      scale = zoomListener.scale();
      x = -source.y0;
      y = -source.x0;
      x = x * scale + viewerWidth / 2;
      y = y * scale + viewerHeight / 2;
      d3.select("g")
        .transition()
        .duration(duration)
        .attr(
          "transform",
          "translate(" + x + "," + y + ")scale(" + scale + ")"
        );
      zoomListener.scale(scale);
      zoomListener.translate([x, y]);
    }

    //Toggle children function
    function toggleChildren(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      return d;
    }

    //Toggle children on click.
    function click(d) {
      //Click suppressed
      if (d3.event.defaultPrevented) return;
      d = toggleChildren(d);
      update(d);
      centerNode(d);
    }

    function update(source) {
      //Compute the new height, function counts total children of root node and
      //sets tree height accordingly.
      //This prevents the layout looking squashed when new nodes are made
      //visible or looking sparse when nodes are removed
      //This makes the layout more consistent.
      var levelWidth = [1];
      var childCount = function (level, n) {
        if (n.children && n.children.length > 0) {
          if (levelWidth.length <= level + 1) levelWidth.push(0);

          levelWidth[level + 1] += n.children.length;
          n.children.forEach(function (d) {
            childCount(level + 1, d);
          });
        }
      };
      childCount(0, root);
      var newHeight = d3.max(levelWidth) * 45; // 45 pixels per line
      tree = tree.size([newHeight, viewerWidth]);

      //Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

      //Set widths between levels based on maxLabelLength.
      nodes.forEach(function (d) {
        //d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
        //alternatively to keep a fixed scale one can set a fixed depth per level
        //Normalize for fixed-depth by commenting out below line
        d.y = d.depth * 300; //500px per level.
      });

      //Update the nodes…
      node = svgGroup.selectAll("g.node").data(nodes, function (d) {
        return d.id || (d.id = ++i);
      });

      //Enter any new nodes at the parent's previous position.
      var nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on("click", click);

      //creaing the drawer for displaying information of the
      var $drawerBackground = document.createElement("div");
      $drawerBackground.id = "drawerBackground";
      $drawerBackground.style.height = window.innerHeight - 1 + "px";
      $drawerBackground.style.width = window.innerWidth - 1 + "px";

      var $drawerPanel = document.createElement("div");
      $drawerPanel.id = "drawerPanel";

      var $drawerHeader = document.createElement("div");
      $drawerHeader.id = "drawerHeader";

      var $drawerTitle = document.createElement("div");
      $drawerTitle.id = "drawerTitle";

      var $drawerExit = document.createElement("div");
      $drawerExit.id = "drawerExit";
      $drawerExit.innerText = "X";

      var $drawerBody = document.createElement("div");
      $drawerBody.id = "drawerBody";
      $drawerBody.style.color = "white";
      $drawerBody.style.flex = "1";
      $drawerBody.style.overflowY = "auto";

      //EVENT LISTNERS

      //on hover change the back background
      $drawerExit.addEventListener("mouseenter", function () {
        $drawerExit.style.backgroundColor = "#444444";
      });

      //on mouse leave change the back ground back
      $drawerExit.addEventListener("mouseleave", function () {
        $drawerExit.style.backgroundColor = "inherit";
        $drawerExit.style.color = "white";
      });

      //Step 0  - Create the input
      var $searchPanelField = document.createElement("input");
      $searchPanelField.id = "searchPanel";
      $searchPanelField.placeholder =
        "Search by group, permission level, or personnel name";

      $drawerHeader.appendChild($drawerTitle);
      $drawerHeader.appendChild($drawerExit);
      $drawerPanel.appendChild($drawerHeader);
      $drawerPanel.appendChild($searchPanelField);
      $drawerPanel.appendChild($drawerBody);
      document.body.append($drawerPanel);

      $drawerBackground.addEventListener("click", function () {
        $drawerPanel.style.animationDuration = "0.5s";
        $drawerPanel.style.animationFillMode = "forwards";
        $drawerPanel.style.animationIterationCount = 1;
        $drawerPanel.style.animationName = "drawerCloseAnimation";
        $drawerPanel.style.animationTimingFunction = "ease-out";
        $searchPanelField.value = "";
        $drawerBody.textContent = ""; //Removes child elements
        $drawerBackground.parentNode.removeChild($drawerBackground);
      });

      $drawerExit.addEventListener("click", function () {
        $drawerPanel.style.animationDuration = "0.5s";
        $drawerPanel.style.animationFillMode = "forwards";
        $drawerPanel.style.animationIterationCount = 1;
        $drawerPanel.style.animationName = "drawerCloseAnimation";
        $drawerPanel.style.animationTimingFunction = "ease-in";
        $searchPanelField.value = "";
        $drawerBody.textContent = "";
        $drawerBackground.parentNode.removeChild($drawerBackground);
      });

      nodeEnter
        .append("circle")
        .attr("class", "nodeCircle")
        .attr("r", 0)
        .style("fill", colorNode)
        .style("stroke", function (d) {
          if (d.class === "found") {
            return "#2E8B57";
          }
        })
        .on("mouseenter", function (d) {
          //Conditional that if the tooltip is active then remove
          if (d3.event.toElement.localName === "circle") {
            $(".node_tooltip").empty();
            $popover.transition().duration(0).style("opacity", 1e-6);
          }
          $popover.transition().duration(0).style("opacity", 0.9);

          //Create my containers
          var $tooltipMainContainer = document.createElement("div");
          $tooltipMainContainer.id = "tooltipMainCont";

          var $tooltipTitle = document.createElement("div");
          $tooltipTitle.id = "tooltipTitle";
          $tooltipTitle.innerText = d.name.toUpperCase();
          $tooltipTitle.style.fontWeight = "400";

          var $trafficContainer = document.createElement("div");
          $trafficContainer.id = "tooltipChildCont";

          var $groupContainer = document.createElement("div");
          $groupContainer.id = "tooltipChildCont";

          $groupContainer.addEventListener("click", function () {
            $drawerTitle.innerText = d.name.toUpperCase();
            //Move the drawer back into the view of the user
            $drawerPanel.style.animationDuration = "0.5s";
            $drawerPanel.style.animationFillMode = "forwards";
            $drawerPanel.style.animationIterationCount = 1;
            $drawerPanel.style.animationName = "drawerOpenAnimation";
            $drawerPanel.style.animationTimingFunction = "ease-out";

            //Append the background
            document.body.append($drawerBackground);
            //Iterate through the array of groups
            //Make a collector
            var people = [];
            //Make the groups to alphabetical order
            var sortedGroups = d.groups.sort(function (a, b) {
              return a.name.localeCompare(b.name, "en", {
                ignorePunctuation: true,
              });
            });

            var typedValue = "";
            function updateGroupArr(e) {
              var groupArr = sortedGroups.map(function (group, index) {
                typedValue = e.target.value.toLowerCase();
                //Match the permission level, or groupNAme
                if (group) {
                  if (
                    group.access.toLowerCase().match(typedValue) ||
                    group.name.toLowerCase().match(typedValue)
                  ) {
                    return group;
                  }
                }
              });
              //Clear and popluate the view
              $drawerBody.textContent = "";
              showGroupCards(groupArr);
            }
            $searchPanelField.addEventListener("input", updateGroupArr);

            //Append my groups first
            function showGroupCards(props) {
              people = [];
              props.forEach(function (group, index) {
                //Seperate into two arrays for actual groups
                if (group) {
                  if (group.isGroup) {
                    var $groupCardContainer = document.createElement("div");
                    $groupCardContainer.id = "drawerCard";
                    $groupCardContainer.style.borderBottom =
                      "1px solid #444444";
                    var $groupCardPersonnel = document.createElement("div");
                    $groupCardPersonnel.innerText = group.name;
                    var $groupCardPermission = document.createElement("div");
                    $groupCardPermission.innerText = group.access;
                    $groupCardPermission.style.color = "#999";
                    $groupCardPermission.style.fontSize = ".6rem";
                    $groupCardContainer.appendChild($groupCardPersonnel);
                    $groupCardContainer.appendChild($groupCardPermission);
                    $drawerBody.appendChild($groupCardContainer);
                  } else {
                    people.push(group);
                  }
                }
              });
              //Append a divider for the Panel
              var $panelDivider = document.createElement("div");
              $panelDivider.innerText =
                "Personnel with Direct Site Permissions";
              $panelDivider.style.backgroundColor = "#444444";
              $panelDivider.style.fontWeight = "600";
              $panelDivider.style.padding = ".5rem";
              $panelDivider.style.textAlign = "center";
              $drawerBody.appendChild($panelDivider);
              $drawerBody.appendChild($panelDivider);

              //Append the personnel afterward
              people.map(function (person, index) {
                var $groupCardContainer = document.createElement("div");
                $groupCardContainer.id = "drawerCard";
                $groupCardContainer.style.borderBottom = "1px solid #444444";
                var $groupCardPersonnel = document.createElement("div");
                $groupCardPersonnel.innerText = person.name;
                var $groupCardPermission = document.createElement("div");
                $groupCardPermission.innerText = person.access;
                $groupCardPermission.style.color = "#999";
                $groupCardPermission.style.fontSize = ".6rem";
                $groupCardContainer.appendChild($groupCardPersonnel);
                $groupCardContainer.appendChild($groupCardPermission);
                $drawerBody.appendChild($groupCardContainer);
              });
            }
            showGroupCards(sortedGroups);
          });

          var $peopleContainer = document.createElement("div");
          $peopleContainer.id = "tooltipChildCont";

          $peopleContainer.addEventListener("click", function () {
            $drawerTitle.innerText = d.name.toUpperCase();
            //Drawer animations
            $drawerPanel.style.animationDuration = "0.5s";
            $drawerPanel.style.animationFillMode = "forwards";
            $drawerPanel.style.animationIterationCount = 1;
            $drawerPanel.style.animationName = "drawerOpenAnimation";
            $drawerPanel.style.animationTimingFunction = "ease-out";
            //append the background
            document.body.append($drawerBackground);
            //alphabetical order
            var sortedPersonnel = d.people.sort(function (a, b) {
              return a.title.localeCompare(b.title, "en", {
                ignorePunctuation: true,
              });
            });

            //Add event listener to listener for change + sort for matches
            var typedValue = "";
            function updatePersonnelArr(e) {
              var personnelArr = sortedPersonnel.map(function (person, index) {
                typedValue = e.target.value.toLowerCase();
                //Match the personnel, group, or groupName
                if (person) {
                  if (
                    person.title.toLowerCase().match(typedValue) ||
                    person.groupName.toLowerCase().match(typedValue) ||
                    person.access.toLowerCase().match(typedValue)
                  ) {
                    return person;
                  }
                }
              });
              //Clear and popluate the view
              $drawerBody.textContent = "";
              showPersonnelCards(personnelArr);
            }
            $searchPanelField.addEventListener("input", updatePersonnelArr);

            //Append the cards
            function showPersonnelCards(props) {
              props.forEach(function (person, index) {
                if (person) {
                  //Seperate into two arrays for actual groups
                  var $personnelCardContainer = document.createElement("div");
                  $personnelCardContainer.id = "drawerCard";
                  $personnelCardContainer.style.backgroundColor = person.duplicate
                    ? "rgba(141, 42, 17, 0.5)"
                    : "inherit";
                  $personnelCardContainer.style.borderBottom =
                    "1px solid #444444";
                  var $personnelCardPersonnel = document.createElement("div");
                  $personnelCardPersonnel.innerText = person.title;
                  var $personnelCardSubtext0 = document.createElement("div");
                  $personnelCardSubtext0.innerText =
                    person.access + " - " + person.groupName;
                  $personnelCardSubtext0.style.color = "#999";
                  $personnelCardSubtext0.style.fontSize = ".6rem";
                  var $personnelCardSubtext1 = document.createElement("div");
                  $personnelCardSubtext1.innerText = person.isAdmin
                    ? "Site Collection Admin"
                    : "";
                  $personnelCardSubtext1.style.color = "#999";
                  $personnelCardSubtext1.style.fontSize = ".6rem";
                  $personnelCardContainer.appendChild($personnelCardPersonnel);
                  $personnelCardContainer.appendChild($personnelCardSubtext0);
                  $personnelCardContainer.appendChild($personnelCardSubtext1);
                  $drawerBody.appendChild($personnelCardContainer);
                }
              });
            }
            showPersonnelCards(sortedPersonnel);
          });

          //Append the child div to parent
          var $siteCount = document.createElement("div");
          $siteCount.innerText = d.count;
          $siteCount.id = "tooltipContCount";
          var $siteTitle = document.createElement("div");
          $siteTitle.innerText = "Traffic";
          $siteTitle.id = "tooltipCont";
          $trafficContainer.appendChild($siteCount);
          $trafficContainer.appendChild($siteTitle);

          var $groupCount = document.createElement("div");
          $groupCount.innerText = d.groups.length;
          $groupCount.id = "tooltipContCount";
          var $groupTitle = document.createElement("div");
          $groupTitle.innerText = "Groups";
          $groupTitle.id = "tooltipCont";
          $groupContainer.appendChild($groupCount);
          $groupContainer.appendChild($groupTitle);

          var $peopleCount = document.createElement("div");
          $peopleCount.innerText = d.people.length;
          $peopleCount.id = "tooltipContCount";
          var $peopleTitle = document.createElement("div");
          $peopleTitle.innerText = "People";
          $peopleTitle.id = "tooltipCont";
          $peopleContainer.appendChild($peopleCount);
          $peopleContainer.appendChild($peopleTitle);

          var $toolTipButton = document.createElement("div");
          $toolTipButton.id = "toolTipBtn";
          var $toolTipButtonLink = document.createElement("a");
          $toolTipButtonLink.href = d.path;
          $toolTipButtonLink.target = "_blank";
          $toolTipButtonLink.id = "toolTipBtnLink";
          $toolTipButtonLink.innerText = "Go to site";
          $toolTipButton.appendChild($toolTipButtonLink);

          //Append the containers to the parent selement
          $tooltipMainContainer.appendChild($tooltipTitle);
          $tooltipMainContainer.appendChild($trafficContainer);
          $tooltipMainContainer.appendChild($groupContainer);
          $tooltipMainContainer.appendChild($peopleContainer);
          $tooltipMainContainer.appendChild($toolTipButton);

          //Append the d3 tooltip div
          $(".node_tooltip").append($tooltipMainContainer);

          function getOffset(el) {
            const rect = el.getBoundingClientRect();
            return {
              left: rect.right,
              top: rect.top,
              width: rect.width,
            };
          }
          function getoffsetTooltip(el) {
            const rect = el.getBoundingClientRect();
            return {
              height: rect.height,
              bottom: rect.bottom,
            };
          }

          var { left, top, width } = getOffset(d3.event.path[0]); //this is the node
          var $tooltip = document.getElementById("hitbox"); //this is the tooltip
          var { bottom, height } = getoffsetTooltip($tooltip);
          $tooltip.style.left = left + width / 2 + "px";
          //The top of the event element (node) minus half the height of the tooltip
          let heightOverflow = top - height;
          if (heightOverflow < 0) {
            heightOverflow = 10;
          }
          $tooltip.style.top = heightOverflow + "px";
        });

      var $hitbox = "";
      node.on("mouseleave", function () {
        $hitbox = document.getElementById("hitbox");
        //If the tooltip is in focus then don't remove
        if (!d3.event.toElement.contains($hitbox)) {
          $(".node_tooltip").empty();
          $popover.transition().duration(0).style("opacity", 1e-6);
        }
      });

      $(".node_tooltip").on("mouseleave", function (e) {
        $(".node_tooltip").empty();
        $popover.transition().duration(1).style("opacity", 1e-6);
      });

      nodeEnter
        .append("text")
        .attr("x", function (d) {
          return d.children || d._children ? -10 : 10;
        })
        .attr("dy", ".35em")
        .attr("class", "nodeText")
        .attr("text-anchor", function (d) {
          return d.children || d._children ? "end" : "start";
        })
        .text(function (d) {
          return d.name;
        })
        .style("fill-opacity", 0);

      //Phantom node to give us mouseover in a radius around it
      nodeEnter
        .append("circle")
        .attr("class", "ghostCircle")
        .attr("r", 30)
        .attr("opacity", 0.2) // change this to zero to hide the target area
        .style("fill", "red")
        .attr("pointer-events", "mouseover");

      //Update the text to reflect whether node has children or not.
      node
        .select("text")
        .attr("x", function (d) {
          return d.children || d._children ? -nodeTextOffset : nodeTextOffset;
        })
        .attr("text-anchor", function (d) {
          return d.children || d._children ? "end" : "start";
        })
        .text(function (d) {
          return d.name;
        });

      //Change the circle fill depending on whether it has children and is collapsed
      node.select("circle.nodeCircle").attr("r", 8).style("fill", colorNode);

      //Transition nodes to their new position.
      var nodeUpdate = node
        .transition()
        .duration(duration)
        .attr("transform", function (d) {
          return "translate(" + d.y + "," + d.x + ")";
        });

      //Fade the text in
      nodeUpdate.select("text").style("fill-opacity", 1);

      //Transition exiting nodes to the parent's new position.
      var nodeExit = node
        .exit()
        .transition()
        .duration(duration)
        .attr("transform", function (d) {
          return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

      nodeExit.select("circle").attr("r", 0);

      nodeExit.select("text").style("fill-opacity", 0);

      //Update the links…
      var link = svgGroup.selectAll("path.link").data(links, function (d) {
        return d.target.id;
      });

      //Calculates if the link has a certain rating for the usage log.
      //It increases the stroke width according to rating
      link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("stroke-width", function (d) {
          if (d.target && d.target.count > 10) {
            return "12";
          } else if (d.target.count > 8) {
            return "8";
          } else if (d.target.count > 6) {
            return "6";
          } else if (d.target.count > 4) {
            return "4";
          } else if (d.target.count > 2) {
            return "2";
          } else {
            return "1";
          }
        })
        .attr("d", function (d) {
          var o = {
            x: source.x0,
            y: source.y0,
          };
          return diagonal({
            source: o,
            target: o,
          });
        });

      //Transition links to their new position.
      link
        .transition()
        .duration(duration)
        .attr("d", diagonal)
        .style("stroke", function (d) {
          if (d.target.class === "found") {
            return "#3949ab"; //pierre changed the color of the link on found
          }
        });

      //Transition exiting nodes to the parent's new position.
      link
        .exit()
        .transition()
        .duration(duration)
        .attr("d", function (d) {
          var o = {
            x: source.x,
            y: source.y,
          };
          return diagonal({
            source: o,
            target: o,
          });
        })
        .remove();

      //Stash the old positions for transition.
      nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    outer_update = update;
    outer_centerNode = centerNode;

    //Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    //Define the root
    root = treeData;
    root.x0 = viewerHeight / 2;
    root.y0 = 0;

    //Layout the tree initially and center on the root node.
    update(root);
    centerNode(root);
    tree_root = root;

    select2Data = [];
    select2DataCollection(root);
    select2DataObject = [];
    select2Data
      .sort(function (a, b) {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
      })
      .filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      }) //Remove duplicate items
      .filter(function (item, i, ar) {
        select2DataObject.push({
          id: i,
          text: item,
        });
      });

    $select2 = $("#searchName").select2({
      data: select2DataObject,
      containerCssClass: "search",
      placeholder: "Search personnel name, site group permission, or site name",
      allowClear: true,
      debug: true,
    });

    //Select2 Searching
    $select2.on("select2:selecting", function (e) {
      clearAll(tree_root);
      expandAll(tree_root);
      outer_update(tree_root);

      //Initially create the styling for the placeholder
      if (!placeholderStyle) {
        placeholderStyle = document.createElement("style");
        placeholderStyle.type = "text/css";
        placeholderStyle.textContent = `.select2-selection__placeholder {
        color: #222 !important;
      }`;
        document.getElementsByTagName("head")[0].appendChild(placeholderStyle);
        //If the style element has already bee created then overwrite
      } else {
        placeholderStyle.style.color = "#222 !important";
      }

      //Replace and make the placeholder the item name
      $select2 = $("#searchName").select2({
        data: select2DataObject,
        containerCssClass: "search",
        placeholder: e.params.args.data.text,
        debug: true,
      });

      $searchClear.style.display = "inherit";
      $searchField = "d.name";
      searchText = e.params.args.data.text;
      firstCall = true;
      searchTree(tree_root, firstCall);
      tree_root.children.forEach(collapseAllNotFound);
      outer_update(tree_root);
      tree_root.children.forEach(centerSearchTarget);
    });

    //Event handler to clear teh search bar
    $searchClear.addEventListener("click", function () {
      $select2 = $("#searchName").select2({
        data: select2DataObject,
        containerCssClass: "search",
        placeholder:
          "Search personnel name, site group permission, or site name",
        debug: true,
      });
      //Reset the color but to the placeholder default
      if (placeholderStyle) {
        var test = document.getElementsByClassName(
          "select2-selection__placeholder"
        )[0];
        test.style.color = "#999 !important";
      }
      $searchClear.style.display = "none";
      clearAll(tree_root);
      expandAll(tree_root);
      outer_update(tree_root);
    });
  }
}
