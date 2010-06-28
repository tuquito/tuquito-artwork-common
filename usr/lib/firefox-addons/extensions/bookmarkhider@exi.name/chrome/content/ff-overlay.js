bookmarkhider.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){ bookmarkhider.showFirefoxContextMenu(e); }, false);
};

bookmarkhider.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("context-bookmarkhider").hidden = gContextMenu.onImage;
};

window.addEventListener("load", bookmarkhider.onFirefoxLoad, false);
