
var fastYoutubeDownloaderSettings = {

	ffPreferences : null,

	init : function() {

	},
	save : function () {
	    var wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
	    var e = wm.getEnumerator(null);
	    while (e.hasMoreElements()) {
		    var w = e.getNext();
		    if (w.fastYoutubeDownloader) {
		 	  w.fastYoutubeDownloader.initExtensionPref();
		    }
	    }	
	}
}
