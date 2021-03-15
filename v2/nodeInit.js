$("document").ready(function () {
  $(document).foundation();
  $(document).on("opened", "[data-reveal]", function () {
    var element = $(".inputName:visible").first();
    element.focus(function () {
      this.selectionStart = this.selectionEnd = this.value.length;
    });
    element.focus();
  });
  $("#searchName").on("select2-selecting", function (e) {
    clearAll(tree_root);
    expandAll(tree_root);
    outer_update(tree_root);

    searchField = "d.name";
    searchText = e.object.text;
    firstCall = true;
    searchTree(tree_root, firstCall);
    tree_root.children.forEach(collapseAllNotFound);
    outer_update(tree_root);
    tree_root.children.forEach(centerSearchTarget);
  });
  var treeJSON = d3.json("tree.json", draw_tree);
});
