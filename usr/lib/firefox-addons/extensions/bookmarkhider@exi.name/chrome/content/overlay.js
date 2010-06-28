var bookmarkhider = {
    prefix: "extensions.bookmarkhider.", //the memory path prefix
    prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch), //memory service
    out: 1, //wheter the mouse is outside of the toolbar
    lastover: 0, //the last time in ms when the mouse was above the toolbar
    hideInterval: 50, //the tick intervall in ms used to slide the toolbar in
    intervalObj: undefined, //the interval object used to animate
    curHeight: 0, //the current height, first values is calculated by this.show()
    origHeight: 0, //the origial height, first values is calculated by this.show()
    overTimer: undefined,
    outTimer: undefined,
    onLoad: function() {
        // initialization code
        this.initialized = true;
    },
    getSlideBool: function() {
        return this.prefs.getBoolPref(this.prefix+"slide");
    },
    getSlidetime: function() {
        return this.prefs.getIntPref(this.prefix+"slidetime");
    },
    getOpentime: function() {
        return this.prefs.getIntPref(this.prefix+"opentime");
    },
    getOpendelay: function() {
        return this.prefs.getIntPref(this.prefix+"opendelay");
    },
    getStyle: function() {
        return this.getToolbar().style;
    },
    getCompHeight: function() {
        var docObj = this.getToolbar();
	var height = parseFloat(document.defaultView.getComputedStyle(docObj, "").getPropertyValue("height"));
        return height;  
    },
    getToolbar: function() {
        return document.getElementById("PersonalToolbar");
    },
    //check for macos
    isMacOS: function() {
        return navigator.appVersion.toLowerCase().indexOf("mac") > 0;;
    },
    useMultiBmToolbar: function() {
	var ret = false;
	try {
	    ret = this.prefs.getBoolPref("extensions.multibmtoolbar.enable");
	} catch(e) { }
	return ret;
    },
    //this function is called whenever the mouse leaves the bookmark toolbar
    mouseout: function() {
        if ( !this.out ) {
	    if ( this.outTimer)
	        window.clearTimeout( this.outTimer );
            this.out = true;
            var mytime = ( new Date() ).getTime();
            if (mytime - this.lastover < this.getOpentime() ) {
                this.outTimer = window.setTimeout('bookmarkhider.hide();', this.getOpentime() - (mytime - this.lastover));
            } else {
                this.hide();
            }
        }
    },
    //this function is calles whenever the mouse enters the toolbar
    mouseover: function() {
        this.lastover = ( new Date() ).getTime();
        if ( this.out ) {
	    if ( this.overTimer )
	        window.clearTimeout( this.overtimer );
            this.clearInterval();
            this.out = false;
            if (this.getOpendelay() > 0) {
                this.overTimer = window.setTimeout('bookmarkhider.show();',this.getOpendelay());
            } else {
                this.show();
            }
        }
    },
    //let the toobar stay open
    stayopen: function() {
        this.out = false;
    },
    //this function resets the toolbar stylings (aka, opens the toolbar) 
    resetStyle: function() {
        var style = this.getStyle();
        style.minHeight = "5px";
        style.maxHeight = "";
	style.height = "";
	//fixing the multibar issues
	if ( this.useMultiBmToolbar() ) {
	    style.setProperty("overflow-y","visible",null);
	}

    },
    //this function sets the interval object
    setInterval: function (func) {
        if ( typeof(this.intervalObj) == 'undefined' )
            this.intervalObj = window.setInterval(func, this.hideInterval );
    },
    //this function cleans the interval object
    clearInterval: function() {
        window.clearInterval(this.intervalObj);
        this.intervalObj = undefined;
    },
    //this function collapses the bar
    collapse: function() {
        this.getToolbar().collapsed=true;
        this.getStyle().visibility="collapse";
    },
    //this function is called whenever the toolbar should show up
    show: function() {
        if ( !this.out ) {
            this.resetStyle();
            this.getToolbar().collapsed = false;
            this.getStyle().visibility = "visible";
	    this.curHeight = this.getCompHeight();
	    this.origHeight = this.getCompHeight();
        }
    },
    //this function is called whenever the toolbar should hide and performs the movement
    hide: function() {
        if ( this.out ) {
            var style = this.getStyle();
            if (this.curHeight > 1 && this.getSlideBool() ) {
                var stepping = (this.origHeight/this.getSlidetime())*this.hideInterval;

                if (isNaN(parseFloat(style.minHeight))) {
                    this.resetStyle();
                }

                if (this.isMacOS()) {
                    this.curHeight = style.minHeight;//macos dirty hack
                }

                var newH = (this.curHeight-stepping)+"px";

                style.minHeight = newH;
                style.maxHeight = newH;
                style.height = newH;

		if ( this.useMultiBmToolbar() ) {
		    style.setProperty("overflow-y","hidden",null);
		}

                this.setInterval('bookmarkhider.hide();');
		this.curHeight = parseFloat(newH);
		if ( this.curHeight < 1 ) {
		    this.curHeight = 0.1;
		}
            } else {
                this.clearInterval();
                style.minHeight = "0px";
                style.maxHeight = "0px";
                this.out = true;
                this.lastover = 0;
                this.collapse();
            }
        }
    }
};

window.addEventListener("load", bookmarkhider.onLoad, false);
