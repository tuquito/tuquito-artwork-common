function Downbar() {
	// you can do |this.wrappedJSObject = this;| for the first version of the component
	// (in case you don't want to write IDL yet.)
	this.wrappedJSObject = this;
}
Downbar.prototype = {
	classID: Components.ID("{D4EE4143-3560-44c3-B170-4AC54D7D8AC1}"),
	contractID: "@devonjensen.com/downbar/downbar;1",
	classDescription: "Window independent Download Statusbar functions",

	QueryInterface: function(aIID) {
		if(!aIID.equals(CI.nsISupports) && !aIID.equals(CI.nsIObserver) && !aIID.equals(CI.nsISupportsWeakReference)) // you can claim you implement more interfaces here
			throw CR.NS_ERROR_NO_INTERFACE;
		return this;
	},

	// nsIObserver implementation
	observe: function(aSubject, aTopic, aData) {

		//var acs = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		//acs.logStringMessage('downbar ' + aTopic + '  ' + aSubject + '  ' + aData);

		switch(aTopic) {
			case "xpcom-startup":
				//dump("xpcom-startup");
				// this is run very early, right after XPCOM is initialized, but before
				// user profile information is applied.
				
				// This is only necessary if I have two different component versions for different Firefox versions
				//var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
				//var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"].getService(Components.interfaces.nsIVersionComparator);
				
				//if(versionChecker.compare(appInfo.version, "3.0a5") >= 0) {
					
					var obsSvc = CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);
					obsSvc.addObserver(this, "profile-after-change", true);
					obsSvc.addObserver(this, "quit-application-granted", true);
					//obsSvc.addObserver(this, "quit-application-requested", true);
					//obsSvc.addObserver(this, "dl-start", true);
					//obsSvc.addObserver(this, "dl-done", true);
					obsSvc.addObserver(this, "em-action-requested", true);
					//obsSvc.addObserver(this, "domwindowopened", true);
					obsSvc.addObserver(this, "download-manager-remove-download", true);
					// "dl-scanning"
					// "dl-failed"
					// "dl-blocked"
				//}

			break;
			
			//case "domwindowopened":
					
			//break;
		
			case "profile-after-change":
				// This happens after profile has been loaded and user preferences have been read.
				// startup code here	
							
				var db_dlmgrContractID = "@mozilla.org/download-manager;1";
				var db_dlmgrIID = Components.interfaces.nsIDownloadManager;
				var db_gDownloadManager = Components.classes[db_dlmgrContractID].getService(db_dlmgrIID);
				db_gDownloadManager.addListener(this);
				
			break;
			
			case "quit-application-requested":
			
			// Firefox 3 broke this - closing a browser window with the X works, but File..Exit doesn't,
			//    so now using the unload event of browser windows, which works with both - downbarClose()
			/*
				var db_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				try {
					var launchDLWin = db_pref.getBoolPref("downbar.function.launchOnClose");
				} catch(e){}
				
				var db_dlmgrContractID = "@mozilla.org/download-manager;1";
				var db_dlmgrIID = Components.interfaces.nsIDownloadManager;
				db_gDownloadManager = Components.classes[db_dlmgrContractID].getService(db_dlmgrIID);		
					
				// xxx paused downloads are included in activeDownloadCount, should I ignore paused downloads?
				if(launchDLWin && db_gDownloadManager.activeDownloadCount > 0) {
					
					// This cancels the quit process - see globalOverlay.js
					//try {
						//aSubject.QueryInterface(Components.interfaces.nsISupportsPRBool);
						//aSubject.data = true;
					//} catch(e){ww.getWindowEnumerator().getNext().alert(e);}
					
					var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
					var dlWin = ww.openWindow(null, 'chrome://mozapps/content/downloads/downloads.xul', null, 'chrome,dialog=no,resizable', null);
				}
			*/
			break;
			
			case "quit-application-granted":
				
				var db_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				try {
					if(db_pref.getBoolPref("downbar.toUninstall")) {
						// Put back the firefox download manager settings
						db_pref.setBoolPref("browser.download.manager.showWhenStarting", true);
						db_pref.setBoolPref("browser.download.manager.showAlertOnComplete", true);
						db_pref.setBoolPref("downbar.toUninstall", false);
						db_pref.setBoolPref("downbar.function.firstRun", true);
						if(!db_pref.getBoolPref("downbar.function.keepHistory"))
							db_pref.setIntPref("browser.download.manager.retention", 0);
							
						// xxx Remove DownbarShow column from download database? it takes a lot of code, dropping and copying entire tables, prob not worth it
												
					}
				} catch(e){}
				
				try {
					var clearOnClose = db_pref.getBoolPref("downbar.function.clearOnClose");
				} catch(e){}
				
				this.db_trimHistory();
				
				if(clearOnClose) {
					this.db_clearAllFinished();
				}
				
		
			break;
			
			case "em-action-requested":
				subject = aSubject.QueryInterface(Components.interfaces.nsIUpdateItem);
				if (subject.id == "{D4DD63FA-01E4-46a7-B6B1-EDAB7D6AD389}") {
					var db_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
					switch (aData) {
		    			case "item-uninstalled":
		     				db_pref.setBoolPref("downbar.toUninstall", true);
		    				break;
		    			case "item-cancel-action":
		     				db_pref.setBoolPref("downbar.toUninstall", false);
		    				break;
		    		}
					
				}
			break;
			
			case "download-manager-remove-download":
								
				// If subject is null, then download clean up was called and I need to repopulate downloads
				if(!aSubject) {
					
					var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
					var e = wm.getEnumerator("navigator:browser");
					var win;
					while (e.hasMoreElements()) {
						win = e.getNext();
						win.db_populateDownloads();
					}
				}
				// xxx if subject is not null, (only one download was removed), do I want to remove it from the download statusbar?
			
			break;
		
			default:
				//throw Components.Exception("Unknown topic: " + aTopic);
		}
	},
	
	// These are download listener functions
	onDownloadStateChange: function(aState, aDownload) {
		
		// var acs = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		// acs.logStringMessage(aDownload.id + '  :  ' + aDownload.state);
		
		switch (aDownload.state) {
	    	//case -1:
			//case 0:
			case 5:   // Queued
	    		this.db_startDownload(aDownload);
	    		return;  // setStateSpecific will already be called during insertNewDownload
	    	break;
	    		
	    	case 1:
	    		this.db_finishDownload(aDownload);
	    	break;
	    }
	    
	    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var e = wm.getEnumerator("navigator:browser");
		var win;
		while (e.hasMoreElements()) {
			win = e.getNext();
			win.db_setStateSpecific("db_" + aDownload.id, aDownload.state);
		}
	},
	onProgressChange: function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress, aDownload) {},
    onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus, aDownload) {},
    onLocationChange: function(aWebProgress, aRequest, aLocation, aDownload) {},
    onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage, aDownload) {},
    onSecurityChange: function(aWebProgress, aRequest, state, aDownload) {},
    
    
    db_startDownload : function(aDownload) {
    	
		var elmpath = aDownload.targetFile.path;
		//var fixedelmpath = elmpath.replace(/\\/g, "\\\\");  // The \ and ' get messed up in the command if they are not fixed
		//fixedelmpath = fixedelmpath.replace(/\'/g, "\\\'");
		var db_fileext = elmpath.split(".").pop().toLowerCase();
	
		var db_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var db_ignoreList = new Array ( );
		
		var ignoreRaw = db_pref.getCharPref("downbar.function.ignoreFiletypes");
		ignoreRaw = ignoreRaw.toLowerCase().replace(/\s/g,'');  // remove all whitespace
		db_ignoreList = ignoreRaw.split(",");
		
		// If it's on the ignore list, don't show it on the downbar
		for (var i=0; i<=db_ignoreList.length; ++i) {
				if (db_fileext == db_ignoreList[i])	
					return;
		}
		
		var id = aDownload.id;
		var state = aDownload.state;
		var referrer = aDownload.referrer;
		var source = aDownload.source.spec;
		var startTime = aDownload.startTime;
		var name = aDownload.displayName;
		
		// Convert target to its URI representation so that icons work correctly (can get unique exe icons on windows)
		var nsIIOService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
		var target = nsIIOService.newFileURI(aDownload.targetFile,null,null).spec;
		
		var db_dlmgrContractID = "@mozilla.org/download-manager;1";
		var db_dlmgrIID = Components.interfaces.nsIDownloadManager;
		db_gDownloadManager = Components.classes[db_dlmgrContractID].getService(db_dlmgrIID);
		var dbase = db_gDownloadManager.DBConnection;
		dbase.executeSimpleSQL("UPDATE moz_downloads SET DownbarShow=1 WHERE id=" + id);
		
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var e = wm.getEnumerator("navigator:browser");
		var win;

		while (e.hasMoreElements()) {
			win = e.getNext();
			
			// Add Download to download bar in each window, and start updates
			win.db_insertNewDownload("db_" + id, target, name, source, state, startTime, referrer);
			win.db_updateDLrepeat("db_" + aDownload.id);
			
			win.document.getElementById("downbar").hidden = false;
			win.db_checkShouldShow();
			win.db_startUpdateMini();
		}
    },
    
    db_finishDownload : function(dl) {
    	
		var elmpath = dl.targetFile.path;
		//var fixedelmpath = elmpath.replace(/\\/g, "\\\\");  // The \ and ' get messed up in the command if they are not fixed
		//fixedelmpath = fixedelmpath.replace(/\'/g, "\\\'");
		var db_fileext = elmpath.split(".").pop().toLowerCase();
		
		this.db_dlCompleteSound(db_fileext);
		
		this.db_AntiVirusScan(elmpath, db_fileext);
		
		var db_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var clearTime = db_pref.getIntPref("downbar.function.timeToClear");
		var clearRaw = db_pref.getCharPref("downbar.function.clearFiletypes");
		var db_clearList = new Array ( );
		
		clearRaw = clearRaw.toLowerCase().replace(/\s/g,'');  // remove all whitespace
		db_clearList = clearRaw.split(",");
		
		// check if it's on the list of autoclear
		var autoClear = false;
		if(db_clearList[0] == "all" | db_clearList[0] == "*")
			autoClear = true;
		else {
			for (var i=0; i<=db_clearList.length; ++i) {
				if (db_fileext == db_clearList[i])
					autoClear = true;
			}
		}
						
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var e = wm.getEnumerator("navigator:browser");
		var win;
		
		// For delayed actions, like autoclear, enumerating each window and calling timeout doesn't work 
		// (all the timeouts are triggered on one window), so need to call a function in the window and have it do the timeout 
		while (e.hasMoreElements()) {
			win = e.getNext();
			
			//var acs = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
			//acs.logStringMessage(win.self._content.location.href);
			
			if(autoClear) {
				win.db_startAutoClear("db_" + dl.id, clearTime*1000);
			}
			
			win.db_startUpdateMini();
		}
    	
    },
    
    // List of the recently cleared downloads so that I can undo clear
    db_recentCleared : [],
    
    db_undoClearOne : function() {
    	
    	var DLid = this.db_recentCleared.pop();
		
		if(DLid) {
			var db_dlmgrContractID = "@mozilla.org/download-manager;1";
			var db_dlmgrIID = Components.interfaces.nsIDownloadManager;
			var db_gDownloadManager = Components.classes[db_dlmgrContractID].getService(db_dlmgrIID);
			var dbase = db_gDownloadManager.DBConnection;
			dbase.executeSimpleSQL("UPDATE moz_downloads SET DownbarShow=1 WHERE id=" + DLid);
			
			try {
				var stmt = dbase.createStatement("SELECT target, name, source, state, startTime, referrer " + 
		                         "FROM moz_downloads " +
		                         "WHERE id = " + DLid);
		        
				stmt.executeStep();
				
				// Insert the download item in all browser windows
				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
				var e = wm.getEnumerator("navigator:browser");
				var win;
			
				while (e.hasMoreElements()) {
					win = e.getNext();
					win.db_insertNewDownload("db_" + DLid, stmt.getString(0), stmt.getString(1), stmt.getString(2), 
									 stmt.getInt32(3), stmt.getInt64(4), stmt.getString(5));
					
					win.db_checkShouldShow();
					win.db_updateMini();
				}
				
				stmt.reset();
			} catch(e) {}
		}	
    },
    
    db_clearAllFinished : function() {
    	
    	// Remove the finished download elements in each browser window
    	try {
    		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			var e = wm.getEnumerator("navigator:browser");
			var win;
			var finishedIDs;
	
			while (e.hasMoreElements()) {
				win = e.getNext();
				finishedIDs = [];  // only want to end up with one copy of this
				var downbarelem = win.document.getElementById("downbar");
					
				var comparray = downbarelem.getElementsByAttribute("state", "1");
				for (i = 0; i <= comparray.length-1; i) {
					
					finishedIDs.push(comparray[i].id.substring(3));
					
					winElem = win.document.getElementById(comparray[i].id);
					downbarelem.removeChild(winElem);
				}
				
				win.db_checkShouldShow();
				win.db_updateMini();
				
    		}
    		
    		// Add all these cleared ids to the recentCleared array
    		this.db_recentCleared = this.db_recentCleared.concat(finishedIDs);
    		
    	} catch(e) {}
    	
    	// Fix the database
    	try {
    		var db_dlmgrContractID = "@mozilla.org/download-manager;1";
			var db_dlmgrIID = Components.interfaces.nsIDownloadManager;
			db_gDownloadManager = Components.classes[db_dlmgrContractID].getService(db_dlmgrIID);
			var dbase = db_gDownloadManager.DBConnection;
			
	    	var db_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	    	var keepHist = db_pref.getBoolPref('downbar.function.keepHistory');
			
			if(keepHist) {
				var simpleStmt = "UPDATE moz_downloads SET DownbarShow=0 WHERE DownbarShow=1 AND state=1";
				dbase.executeSimpleSQL(simpleStmt);
			}
			else {
			// I could edit the database directly, 
			//   but by calling removeDownload, observers are notified of the "download-manager-remove-download" topic automatically
				try {
					var stmt = dbase.createStatement("SELECT id FROM moz_downloads WHERE DownbarShow=1 AND state=1");
				}
				catch(e) {
					return;
				}
				try {
					while (stmt.executeStep()) {
						db_gDownloadManager.removeDownload(stmt.getInt32(0));
					}
				}
				finally {
					stmt.reset();
				}	
			}
    	} catch(e){}
    		
    },
    
	db_dlCompleteSound : function(fileExt) {
	
		var db_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	
		try {
			var shouldSound = db_pref.getIntPref("downbar.function.soundOnComplete");  // 0:no sound, 1: default sound, 2: custom sound
			var ignoreListRaw = db_pref.getCharPref("downbar.function.soundCompleteIgnore");
		} catch(e){}
		
		if(shouldSound == 0)
			return;
		
		var soundIgnoreList = new Array ( );
		ignoreListRaw = ignoreListRaw.toLowerCase().replace(/\s/g,'');  // remove all whitespace
		soundIgnoreList = ignoreListRaw.split(",");
		
		var toIgnore = false;
		for (var i=0; i<=soundIgnoreList.length; ++i) {
			if (fileExt == soundIgnoreList[i])
				toIgnore = true;
		}
		if(toIgnore)
			return;
			
		try {
			var sound = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
			var nsIIOService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
			
			var soundLoc;
			if(shouldSound == 1)
				soundLoc = "chrome://downbar/content/downbar_finished.wav";
			
			if(shouldSound == 2) {
				var soundLoc = db_pref.getCharPref("downbar.function.soundCustomComplete");  //format of filesystem sound "file:///c:/sound1_final.wav"
			}
			
		
			soundURIformat = nsIIOService.newURI(soundLoc,null,null);
			sound.play(soundURIformat);
		} catch(e) {
			sound.beep;
		}
		
	},
	
	db_AntiVirusScan : function(filepath, db_fileext) {
		
		//var acs = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		//acs.logStringMessage(filepath);
		
		var db_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var shouldScan = db_pref.getBoolPref("downbar.function.virusScan");
		if(shouldScan) {
			
			var dlPath = filepath;
			try {
				var defCharset = db_pref.getComplexValue("intl.charset.default", Components.interfaces.nsIPrefLocalizedString).data;
				var uniConv = Components.classes['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
				uniConv.charset = defCharset;
				var convertedPath = uniConv.ConvertFromUnicode(dlPath);
				dlPath = convertedPath;
			}
			catch(e) {}
			
			var db_excludeList = new Array ( );
			var excludeRaw = db_pref.getCharPref("downbar.function.virusExclude");
			excludeRaw = excludeRaw.toLowerCase().replace(/\s/g,'');  // remove all whitespace
			db_excludeList = excludeRaw.split(",");
			
			var excludeFiletype = false;
			for (var i=0; i<=db_excludeList.length; ++i) {
				if (db_fileext == db_excludeList[i])
					excludeFiletype = true;
			}
			
			if(!excludeFiletype) {	
				try {
					var AVProgLoc = db_pref.getCharPref("downbar.function.virusLoc");
					var AVArgs = db_pref.getCharPref("downbar.function.virusArgs");
					var AVExecFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
					var process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
					
					// Arguments must be separated into an array
					var args = AVArgs.split(" ");
					// Put the path where it is supposed to be
					for (var i=0; i<args.length; ++i) {
						args[i] = args[i].replace(/%1/g, dlPath);
					}
					
					AVExecFile.initWithPath(AVProgLoc);
					if (AVExecFile.exists()) {
						process.init(AVExecFile);
						process.run(false, args, args.length);
					}
					else {
						var bundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
						var stringBundle = bundleService.createBundle("chrome://downbar/locale/downbar.properties");
							
						var promptSvc = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
						promptSvc.alert(null,"Download Statusbar",stringBundle.GetStringFromName("AVnotFound"));
					}
				} catch (e) {
						var bundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
						var stringBundle = bundleService.createBundle("chrome://downbar/locale/downbar.properties");
							
						var promptSvc = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
						promptSvc.alert(null,"Download Statusbar",stringBundle.GetStringFromName("failedAV"));
					return;
				}
			}
		}
		
	},
	
	db_trimHistory : function() {
		
		var db_pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		try {
			var shouldTrim = db_pref.getBoolPref("downbar.function.trimHistory");
			var trimOffset = db_pref.getIntPref("downbar.function.numToTrim");
			var downloadRetention = db_pref.getIntPref("browser.download.manager.retention");
		} catch (e){}
		
		if(!shouldTrim)
			return;
		if(downloadRetention != 2) // Then it is clearing on close or on successful download and this will have no effect
			return;
	
		const db_dlmgrContractID = "@mozilla.org/download-manager;1";
		const db_dlmgrIID = Components.interfaces.nsIDownloadManager;
		db_gDownloadManager = Components.classes[db_dlmgrContractID].getService(db_dlmgrIID);
		var dbase = db_gDownloadManager.DBConnection;
		
		// Delete the all but the last xx rows from the database, if it is done, canceled, or failed
		dbase.executeSimpleSQL("DELETE FROM moz_downloads " +
								"WHERE (state=1 OR state=2 OR state=3) " +
								"AND id NOT IN (select id from moz_downloads ORDER BY id DESC LIMIT " + trimOffset + ")");
		
	},

};


// constructors for objects we want to XPCOMify
var objects = [Downbar];

/*
* Registration code.
*
*/

const CI = Components.interfaces, CC = Components.classes, CR = Components.results;

const MY_OBSERVER_NAME = "Downbar Observer";

function FactoryHolder(aObj) {
this.CID        = aObj.prototype.classID;
this.contractID = aObj.prototype.contractID;
this.className  = aObj.prototype.classDescription;
this.factory = {
createInstance: function(aOuter, aIID) {
if(aOuter)
throw CR.NS_ERROR_NO_AGGREGATION;
return (new this.constructor).QueryInterface(aIID);
}
};
this.factory.constructor = aObj;
}

var gModule = {
registerSelf: function (aComponentManager, aFileSpec, aLocation, aType)
{
aComponentManager.QueryInterface(CI.nsIComponentRegistrar);
for (var key in this._objects) {
var obj = this._objects[key];
aComponentManager.registerFactoryLocation(obj.CID, obj.className,
obj.contractID, aFileSpec, aLocation, aType);
}

// this can be deleted if you don't need to init on startup
var catman = CC["@mozilla.org/categorymanager;1"].getService(CI.nsICategoryManager);
catman.addCategoryEntry("xpcom-startup", MY_OBSERVER_NAME,
Downbar.prototype.contractID, true, true);
catman.addCategoryEntry("xpcom-shutdown", MY_OBSERVER_NAME,
Downbar.prototype.contractID, true, true);
},

unregisterSelf: function(aCompMgr, aFileSpec, aLocation) {
// this must be deleted if you delete the above code dealing with |catman|
var catman = CC["@mozilla.org/categorymanager;1"].getService(CI.nsICategoryManager);
catman.deleteCategoryEntry("xpcom-startup", MY_OBSERVER_NAME, true);
// end of deleteable code

aComponentManager.QueryInterface(CI.nsIComponentRegistrar);
for (var key in this._objects) {
var obj = this._objects[key];
aComponentManager.unregisterFactoryLocation(obj.CID, aFileSpec);
}
},

getClassObject: function(aComponentManager, aCID, aIID) {
if (!aIID.equals(CI.nsIFactory)) throw CR.NS_ERROR_NOT_IMPLEMENTED;

for (var key in this._objects) {
if (aCID.equals(this._objects[key].CID))
return this._objects[key].factory;
}

throw CR.NS_ERROR_NO_INTERFACE;
},

canUnload: function(aComponentManager) {
return true;
},

_objects: {} //FactoryHolder
};

function NSGetModule(compMgr, fileSpec)
{
for(var i in objects)
gModule._objects[i] = new FactoryHolder(objects[i]);
return gModule;
} 