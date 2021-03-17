//Load supporting scripts

var scripts = [
  "nodeTreeV2/vendors/jquery.js",
  "nodeTree/formatUsageLog.js",
  "nodeTreeV2/vendors/d3.v3.min.js",
  "nodeTreeV2/vendors/modernizr.js",
  "nodeTreeV2/vendors/placeholder.js",
  "nodeTreeV2/vendors/select2.min.js",
  "nodeTreeV2/vendors/underscore-min.js",
  "nodeTreeV2/d3-context-menu.js",
  "nodeTreeV2/foundation.min.js",
  "nodeTreeV2/foundation.alert.js",
  "nodeTreeV2/foundation.reveal.js",
];

var links = [
  "nodeTreeV2/styles/select2.min.css",
  "nodeTreeV2/styles/app.css",
  "nodeTreeV2/styles/d3-context-menu.css",
];

(function () {
  function linkBuilder(path) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = _spPageContextInfo.webAbsoluteUrl + "/SiteAssets/ims/" + path;
    document.head.appendChild(link);
    return link;
  }
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

  function scriptBuilder(path) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = _spPageContextInfo.webAbsoluteUrl + "/SiteAssets/ims/" + path;
    script.defer = true;
    script.async = false;
    document.body.appendChild(script);
    return script;
  }

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
          createNodeTree();
        });
      }
    });
  }
  loadScripts();

  // removing the spacer for the webparts
  // removes the SCRIPT EDITOR
  if (
    document.getElementsByClassName("ms-core-tableNoSpace ms-webpartPage-root")
  ) {
    var removeSpace = document.getElementsByClassName(
      "ms-core-tableNoSpace ms-webpartPage-root"
    );
    removeSpace[0].remove();
  }
})();

function createNodeTree() {
  Foundation.global.namespace = ""; // pierre
  //Create the div for the nodeTree + append to content area
  var initTree = document.createElement("div");
  initTree.id = "tree-container";

  //Create search box + drop down
  var searchContainer = document.createElement("div");
  searchContainer.class = "search";
  var blockContainer = document.createElement("div");
  blockContainer.id = "block-container";
  var searchField = document.createElement("div");
  searchField.id = "searchName";

  blockContainer.appendChild(searchField);
  searchContainer.appendChild(blockContainer);

  //Append to the area where webparts go
  var nodeTreeContainer = document.getElementById("contentBox");
  nodeTreeContainer.appendChild(searchContainer);
  nodeTreeContainer.appendChild(initTree);

  // for the first initialization
  $("document").ready(function () {
    $(document).foundation();
    $(document).on("opened", "[data-reveal]", function () {
      var element = $(".inputName:visible").first();
      element.focus(function () {
        this.selectionStart = this.selectionEnd = this.value.length;
      });
      element.focus();
    });
    //Select2 Searching
    $("#searchName").on("select2:selecting", function (e) {
      clearAll(tree_root);
      expandAll(tree_root);
      outer_update(tree_root);

      console.log("event data onSelect:", e);

      searchField = "d.name";
      searchText = e.params.args.data.text;
      firstCall = true;
      searchTree(tree_root, firstCall);
      tree_root.children.forEach(collapseAllNotFound);
      outer_update(tree_root);
      tree_root.children.forEach(centerSearchTarget);
    });
    //Select2 Clearing
    $("#searchName").on("select2:clearing", function (e) {
      console.log("event data onClear:", e);

      searchField = null;
      searchText = null;
      clearAll(tree_root);
      expandAll(tree_root);
      outer_update(tree_root);
      console.log("revised 0");
    });
    function cb(error, props) {
      if (error) {
        console.log(error);
        return;
      }
      draw_tree(null, props[0]);
    }
    formatUsageLog(cb);
  });

  function close_modal() {
    $(document).foundation("reveal", "close");
  }

  var tree_root;
  outer_update = null;
  outer_centerNode = null;
  var nodeTextOffset = 15;

  function select2DataCollectName(d) {
    if (d.children) d.children.forEach(select2DataCollectName);
    else if (d._children) d._children.forEach(select2DataCollectName);
    select2Data.push(d.name);
  }

  function searchTree(d, first_call = false) {
    if (d.children) d.children.forEach(searchTree);
    else if (d._children) d._children.forEach(searchTree);
    var searchFieldValue = eval(searchField);
    if (searchFieldValue && searchFieldValue.match(searchText)) {
      if (first_call) {
        d.search_target = true;
      } else {
        d.search_target = false;
      }
      // Walk parent chain
      if (d.name) {
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
      //console.log("Found search target: " + d.name);
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

  function nodeToolTip(d) {
    html = '<a href="' + d.directory_url + '">' + d.display_name + "</a>";
    lines = 1;
    if (d.count) {
      html += "<br/>" + d.count;
      lines += 1;
    }
    if (d.department) {
      html += "<br/>" + d.department;
      lines += 1;
    }
    return { html: html, lines: lines };
  }

  function draw_tree(error, treeData) {
    // Calculate total nodes, max label length
    var totalNodes = 0;
    var maxLabelLength = 0;
    // panning variables
    var panSpeed = 200;
    var panBoundary = 20; // Within 20px from edges will pan when dragging.
    // Misc. variables
    var i = 0;
    var duration = 750;
    var root;

    // size of the diagram
    var viewerWidth = $(document).width();
    var viewerHeight = $(document).height();

    var tree = d3.layout.tree().size([viewerHeight, viewerWidth]);

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal().projection(function (d) {
      return [d.y, d.x];
    });

    // A recursive helper function for performing some setup by walking through all nodes

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

    // Call visit function to establish maxLabelLength
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

    // sort the tree according to the node names

    function sortTree() {
      tree.sort(function (a, b) {
        return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
      });
    }
    // Sort the tree initially incase the JSON isn't in a sorted order.
    sortTree();

    // TODO: Pan function, can be better implemented.

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

    // Define the zoom function for the zoomable tree

    function zoom() {
      svgGroup.attr(
        "transform",
        "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"
      );
    }

    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior
      .zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", zoom);

    var div = d3
      .select("#tree-container")
      .append("div")
      .attr("class", "node_tooltip")
      .style("opacity", 0);

    // define the baseSvg, attaching a class for styling and the zoomListener
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

    // Helper functions for collapsing and expanding nodes.

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

    // color a node properly
    function colorNode(d) {
      result = "#fff";
      if (d.class === "found") {
        result = "#ff4136"; //red
      } else if (d.type == "synthetic") {
        result = d._children || d.children ? "darkgray" : "lightgray";
      } else if (d.type == "person") {
        result = d._children || d.children ? "royalblue" : "skyblue";
      } else if (d.type == "two") {
        result = d._children || d.children ? "orangered" : "orange";
      } else if (d.type == "three") {
        result = d._children || d.children ? "yellowgreen" : "yellow";
      } else {
        result = "lightsteelblue";
      }
      return result;
    }

    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

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

    // Toggle children function

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

    // Toggle children on click.

    function click(d) {
      if (d3.event.defaultPrevented) return; // click suppressed
      d = toggleChildren(d);
      update(d);
      centerNode(d);
    }

    function update(source) {
      // Compute the new height, function counts total children of root node and sets tree height accordingly.
      // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
      // This makes the layout more consistent.
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

      // Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

      // Set widths between levels based on maxLabelLength.
      nodes.forEach(function (d) {
        //d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
        // alternatively to keep a fixed scale one can set a fixed depth per level
        // Normalize for fixed-depth by commenting out below line
        d.y = d.depth * 300; //500px per level.
      });

      // Update the nodes…
      node = svgGroup.selectAll("g.node").data(nodes, function (d) {
        return d.id || (d.id = ++i);
      });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on("click", click);

      nodeEnter
        .append("circle")
        .attr("class", "nodeCircle")
        .attr("r", 0)
        .style("fill", colorNode)
        .style("stroke", function (d) {
          if (d.class === "found") {
            return "#2E8B57"; // seagreen
          }
        })
        .on("mouseenter", function (d) {
          console.log("add tooltip");
          tooltipInfo = nodeToolTip(d);
          //pierre added this
          // d.display_name = "Placeholder Display Name";
          // d.url = "Placeholder Url";
          // d.department = "Placeholder Dept";
          if (d.display_name) {
            div.transition().duration(200).style("opacity", 0.9);
            div
              .html(tooltipInfo.html)
              .style("left", d3.event.pageX + 20 + "px")
              .style("top", d3.event.pageY - 5 + "px");
          }
        })
        .on("mouseleave", function (d) {
          console.log("remove tooltip");
          //selecting the element by id
        });

      //add a mouse leave event

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

      // phantom node to give us mouseover in a radius around it
      nodeEnter
        .append("circle")
        .attr("class", "ghostCircle")
        .attr("r", 30)
        .attr("opacity", 0.2) // change this to zero to hide the target area
        .style("fill", "red")
        .attr("pointer-events", "mouseover")
        .on("mouseover", function (node) {
          overCircle(node);
        })
        .on("mouseout", function (node) {
          outCircle(node);
        });

      // Update the text to reflect whether node has children or not.
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

      // Change the circle fill depending on whether it has children and is collapsed
      node
        .select("circle.nodeCircle")
        //.attr("r", 4.5)
        .attr("r", 8)
        .style("fill", colorNode);

      // Transition nodes to their new position.
      var nodeUpdate = node
        .transition()
        .duration(duration)
        .attr("transform", function (d) {
          return "translate(" + d.y + "," + d.x + ")";
        });

      // Fade the text in
      nodeUpdate.select("text").style("fill-opacity", 1);

      // Transition exiting nodes to the parent's new position.
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

      // Update the links…
      var link = svgGroup.selectAll("path.link").data(links, function (d) {
        return d.target.id;
      });

      // Enter any new links at the parent's previous position.

      link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("stroke-width", function (d) {
          if (d.target.count > 2000) {
            return "14";
          } else if (d.target.count > 1500) {
            return "12";
          } else if (d.target.count > 1000) {
            return "10";
          } else if (d.target.count > 500) {
            return "8";
          } else if (d.target.count > 250) {
            return "6";
          } else if (d.target.count > 200) {
            return "4";
          } else if (d.target.count > 100) {
            return "2";
          } else if (d.target.count > 50) {
            return "1";
          } else {
            return ".5";
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

      // Transition links to their new position.
      link
        .transition()
        .duration(duration)
        .attr("d", diagonal)
        .style("stroke", function (d) {
          if (d.target.class === "found") {
            return "#2E8B57"; // seagreen
          }
        });

      // Transition exiting nodes to the parent's new position.
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

      // Stash the old positions for transition.
      nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    outer_update = update;
    outer_centerNode = centerNode;

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    // Define the root
    root = treeData;
    root.x0 = viewerHeight / 2;
    root.y0 = 0;

    // Layout the tree initially and center on the root node.
    update(root);
    centerNode(root);
    tree_root = root;

    select2Data = [];
    select2DataCollectName(root);
    select2DataObject = [];
    select2Data
      .sort(function (a, b) {
        if (a > b) return 1; // sort
        if (a < b) return -1;
        return 0;
      })
      .filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      }) // remove duplicate items
      .filter(function (item, i, ar) {
        select2DataObject.push({
          id: i,
          text: item,
        });
      });
    $("#searchName").select2({
      data: select2DataObject,
      containerCssClass: "search",
      placeholder: "Search this tree",
      allowClear: true,
      debug: true,
    });
  }
}
