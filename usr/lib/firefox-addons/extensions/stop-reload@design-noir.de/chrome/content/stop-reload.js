window.addEventListener("load", function () {
  MergeReloadStop.wrap();
  var cmd_CustomizeToolbars = document.getElementById("cmd_CustomizeToolbars");
  cmd_CustomizeToolbars.setAttribute("oncommand", "MergeReloadStop.unwrap(); " +
                                                  cmd_CustomizeToolbars.getAttribute("oncommand"));
  setTimeout(function () {
    var toolbox = window.getNavToolbox ? getNavToolbox() : document.getElementById("navigator-toolbox");
    var customizeDone = toolbox.customizeDone;
    toolbox.customizeDone = function (aToolboxChanged) {
      customizeDone(aToolboxChanged);
      MergeReloadStop.wrap();
    };
  }, 1000);
}, false);

var MergeReloadStop = {
  wrap: function () {
    var stop = document.getElementById("stop-button");
    if (!stop)
      return;

    var reload = document.getElementById("reload-button");
    if (!reload)
      return;

    this.reloadComesFirst = (reload.nextSibling == stop);
    if (!this.reloadComesFirst && stop.nextSibling != reload)
      // buttons aren't adjacent
      return;

    this.container = document.createElement("deck");
    this.container.id = "stop-reload-container";
    stop.parentNode.replaceChild(this.container, stop);
    this.container.appendChild(stop);
    this.container.appendChild(reload);
    this.stop = stop;
    this.reload = reload;
    this.container.selectedPanel =
      document.getElementById("Browser:Stop").getAttribute("disabled") == "true"
      ? reload : stop;
    stop.addEventListener("click", this, false);
    getBrowser().addProgressListener(this);
  },
  onLocationChange: function () {},
  onProgressChange: function () {},
  onStatusChange:   function () {},
  onSecurityChange: function () {},
  onStateChange:    function (aWebProgress, aRequest, aStateFlags, aStatus) {
    if (aRequest && !(aRequest instanceof Ci.nsIChannel))
      return;
    if (aStateFlags & Ci.nsIWebProgressListener.STATE_START) {
      this._switchToStop();
    } else if (aStateFlags & Ci.nsIWebProgressListener.STATE_STOP) {
      var isNetworkLoad =
            aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK &&
            aRequest &&
            aWebProgress.DOMWindow == content;
      this._switchToReload(isNetworkLoad);
    }
  },
  handleEvent: function (event) {
    if (event.button == 0)
      this._stopClicked = true;
  },
  _switchToStop: function () {
    this._cancelTransition();
    this.container.selectedPanel = this.stop;
  },
  _switchToReload: function (aDelay) {
    if (!aDelay || this._stopClicked) {
      this._stopClicked = false;
      this._cancelTransition();
      this.container.selectedPanel = this.reload
      return;
    }
    if (this._timer)
      return;
    this._timer = setTimeout(function (self) {
      self._timer = 0;
      self.container.selectedPanel = self.reload;
    }, 650, this);
  },
  _cancelTransition: function () {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = 0;
    }
  },
  unwrap: function () {
    if (this.container) {
      var toolbar = this.container.parentNode;
      if (this.reloadComesFirst) {
        toolbar.replaceChild(this.stop, this.container);
        toolbar.insertBefore(this.reload, this.stop);
      } else {
        toolbar.replaceChild(this.reload, this.container);
        toolbar.insertBefore(this.stop, this.reload);
      }
      this.destroy();
    }
  },
  destroy: function () {
    this._cancelTransition();
    if (this.container) {
      getBrowser().removeProgressListener(this);
      this.stop.removeEventListener("command", this, false);
      this.container = null;
      this.reload = null;
      this.stop = null;
    }
  }
};
