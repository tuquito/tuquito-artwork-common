/*
	For Debugging:
	
	var ConsSrv = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
	ConsSrv.logStringMessage("foo");
*/

/* utils service definition */
function FoobarUtils(){
	/* the initializing function */
	
	/* setup services */
	foobarUtilsProps.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	
	/* listeners */
	foobarUtilsProps.preferanceObserver = new foobarUtilsPrefObserver();
	
	/* preferences */
	setFoobarUtilsPrefs();
	
	/* wrapped javascript object */
	this.wrappedJSObject = this;
};

FoobarUtils.prototype = {
	QueryInterface : function (iid){
		if (iid.equals(Components.interfaces.nsISupports)){
			return this;
		};
		
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
	stringParser : {
		/* a set of functions for handling URL and search string manipulations */
		
		isNavigable : function(s){
			/* checks to see if the address bar needs to navigate normally (ie its text is a URL, keymark, etc) */
			if (s == "" || s.substr(0, 1) == foobarUtilsProps.engineDelimiter){
				return false;
			}else{
				var isNav = false,
					regexObvious = /^(localhost|ftp:|http:|https:|about:|chrome:|www\.)/i,
					regexIP = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
					regexURL = /\.[a-z]{2,4}$|\.[a-z]{2,4}[:/?]/i,
					fixupService = Components.classes["@mozilla.org/docshell/urifixup;1"].getService(Components.interfaces.nsIURIFixup),
					ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),
					bookmarkService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Components.interfaces.nsINavBookmarksService);
				
				/* createExposableURI will tell us if it's most definitely navigable */
				try{
					var newURI = ioService.newURI(s, null, null);
					var eURI = fixupService.createExposableURI(newURI);
					isNav = true;
				}catch(ex){};
				
				/* if it's too ambiguous for createExposableURI, we need to try some other things */
				if (!isNav){
					/* createFixupURI will help us identify relative and network paths - but will simply add http:// to pretty much anything else */
					if (!isNav){
						try{
							var fURI = fixupService.createFixupURI(s, 0);
							
							if (fURI && !regexObvious.test(fURI.spec)){
								isNav = true;
							};
						}catch(ex){};
					};
					
					/* make your best guess then... */
					if (!isNav){
						isNav = (regexObvious.test(s) || regexIP.test(s) || regexURL.test(s));
					};
				};
				
				/* check to see if this is a google search like "define:test" or "cache:google.com" */
				if (isNav){
					isNav = this.testForNetworkProtocol(s, regexObvious);
				};
				
				return isNav;
			};
		},
		txtSearchObject : function(s){
			/* takes in the string from the urlbar and returns [search string, [given engine aliases]] where [given engine aliases] may be null */
			var returnObj = [];
			
			if (s == "" || s.substr(0, 1) != foobarUtilsProps.engineDelimiter){
				returnObj.push(s);
			}else{
				var givenEngineText = s.split(" ")[0],
					givenEngines = givenEngineText.split(foobarUtilsProps.engineDelimiter);
				
				if (givenEngineText != "" && givenEngines.length > 0){
					returnObj.push((s.indexOf(" ") > -1) ? s.replace(givenEngineText + " ", "") : "");
					returnObj.push([]);
					
					for (ge in givenEngines){
						if (givenEngines[ge] != ""){
							returnObj[1].push(givenEngines[ge]);
						};
					};
				}else{
					returnObj.push(s);
				};
			};
			
			return returnObj;
		},
		testForNetworkProtocol : function(s, regObv){
			/* createExposableURI & createFixupURI tend to think that a search string like "define:test" is a network protocol like "mailto:test@test.com" -
			   this section will check for that and fix if necessary.
			   even my 'best guess' can confuse "cache:google.com" as navigable and not searchable, and must be passed through this to check first */
			
			var isNav = true;
			
			if (s.indexOf(":") > -1 && !regObv.test(s)){
				var sSplit = s.split(":")[0];
				
				try{
					var testingPref = foobarUtilsProps.prefManager.getBoolPref("network.protocol-handler.external." + sSplit);
				}catch(ex){ isNav = false; };
			};
			
			return isNav;
		}
	}
};

/* utils service registration */
var FoobarUtilsModule = {
	firstTime : true,
	registerSelf : function(compMgr, fileSpec, location, type){
		if (this.firstTime){
			this.firstTime = false;
			throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
		};
		
		compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		compMgr.registerFactoryLocation(FOOBAR_UTILS_CLASS_ID, FOOBAR_UTILS_CLASS_NAME, FOOBAR_UTILS_CONTRACT_ID, fileSpec, location, type);
	},
	getClassObject : function(compMgr, cid, iid){
		if (!cid.equals(FOOBAR_UTILS_CLASS_ID)){
			throw Components.results.NS_ERROR_NO_INTERFACE;
		};
		
		if (!iid.equals(Components.interfaces.nsIFactory)){
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		};
		
		return this.newFactory;
	},
	newFactory : {
		createInstance : function(outer, iid){
			if (outer != null){
				throw Components.results.NS_ERROR_NO_AGGREGATION;
			};
			
			return (new FoobarUtils()).QueryInterface(iid);
		}
	},
    canUnload : function(compMgr){
        return true;
    }
};

function NSGetModule(compMgr, fileSpec){
	return FoobarUtilsModule;
};

/* properties */
const FOOBAR_UTILS_CLASS_ID = Components.ID("{CB2D0AF0-2C72-11DF-9517-D59556D89593}");
const FOOBAR_UTILS_CLASS_NAME = "Foobar Utilities Service";
const FOOBAR_UTILS_CONTRACT_ID = "@foobar.com/utils;1";

var foobarUtilsProps = {
	prefManager :			null,
	preferanceObserver :	null,
	engineDelimiter :		"/"
};

function setFoobarUtilsPrefs(){
	foobarUtilsProps.engineDelimiter = foobarUtilsProps.prefManager.getCharPref("extensions.foobar.searchenginedelimiter");
};

/* observation deck */
/* observer for preference changes */
function foobarUtilsPrefObserver(){
	this.register();
};

foobarUtilsPrefObserver.prototype = {
	observe : function(subject, topic, data){
		if (topic == "nsPref:changed"){
			setFoobarUtilsPrefs();
		};
	},
	register : function(){
		var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch2);
		prefService.addObserver("extensions.foobar.searchenginedelimiter", this, false);
	},
	unregister : function(){
		/* not implimented */
	}
};