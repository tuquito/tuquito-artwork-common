/*
	For Debugging:
	
	var ConsSrv = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
	ConsSrv.logStringMessage("foo");
*/

/*
	To Mozilla Developers:
	
	I have 2 places where I set a timeout - both are related to the autocomplete popup on the address bar.
		It often shows up unwanted, and a little time is required to wait on it to show itself before I can close it.
	
	I have a utility component that is shared between this code and my autocomplete component - the best/easiest way
		I could find to build it was to use the wrapped javascript object.  I access no other wrapped javascript objects
		besides this utility componenet.
*/

/* main plugin definition */
var foobar = {
	construct : function(){
		/* the initializing function */
		
		/* setup services */
		foobarPluginProps.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		foobarPluginProps.searchService = Components.classes["@mozilla.org/browser/search-service;1"].getService(Components.interfaces.nsIBrowserSearchService);
		foobarPluginProps.stringService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
		foobarPluginProps.localeService = Components.classes["@mozilla.org/intl/nslocaleservice;1"].getService(Components.interfaces.nsILocaleService);
		foobarPluginProps.observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		foobarPluginProps.stringBundle = foobarPluginProps.stringService.createBundle("chrome://foobar/locale/strings.properties", foobarPluginProps.localeService.getApplicationLocale());
		foobarPluginProps.foobarUtils = Components.classes["@foobar.com/utils;1"].getService().wrappedJSObject;
		
		/* listeners */
		gURLBar.addEventListener("keydown", foobar.handleAddressBarKeyDown, false);
		gURLBar.addEventListener("DOMMouseScroll", foobar.addressBarManualSeChange, false);
		
		foobarPluginProps.addressBarOTE = gURLBar.getAttribute("ontextentered");
		gURLBar.setAttribute("ontextentered", "foobar.handleAddressBarEntry(param);");
		
		foobarPluginProps.goButton = document.getElementById("go-button");
		
		foobarPluginProps.goButtonOC = foobarPluginProps.goButton.getAttribute("onclick");
		foobarPluginProps.goButton.setAttribute("onclick", "foobar.handleAddressBarEntry(event);");
		
		foobarPluginProps.secObserver = new foobarPluginSearchEngineObserver();
		foobarPluginProps.preferanceObserver = new foobarPluginPrefObserver();
		foobarPluginProps.popObserver = new foobarPluginPopupObserver();
		
		/* custom addressbar autocomplete */
		foobarPluginProps.addressBarACS = gURLBar.getAttribute("autocompletesearch");
		var newACS = foobarPluginProps.addressBarACS.replace(" history", "").replace("history ", "").replace("history", "");
		newACS = (newACS != "") ? " foobar-autocomplete" : "foobar-autocomplete";
		gURLBar.setAttribute("autocompletesearch", newACS);
		
		/* setup other */
		foobarPluginProps.seIconTooltip = foobarPluginProps.stringBundle.GetStringFromName("foobar.seIconTooltip");
		foobarPluginProps.openSearchAdd = foobarPluginProps.stringBundle.GetStringFromName("foobar.openSearchAdd");
		foobarPluginProps.searchSuggestTxt = foobarPluginProps.stringBundle.GetStringFromName("foobar.searchSuggestTxt");
		foobarPluginProps.emptySearch1 = foobarPluginProps.stringBundle.GetStringFromName("foobar.emptySearch1");
		foobarPluginProps.emptySearch2 = foobarPluginProps.stringBundle.GetStringFromName("foobar.emptySearch2");
		
		/* preferences */
		foobar.setPrefs();
		
		/* initialize foobar */
		foobar.setAddressBarWidget();
	},
	destruct : function(){
		/* the destroying function */
		
		foobarPluginProps.secObserver.unregister();
		foobarPluginProps.preferanceObserver.unregister();
		foobarPluginProps.popObserver.unregister();
		
		gURLBar.setAttribute("ontextentered", foobarPluginProps.addressBarOTE);
		foobarPluginProps.goButton.setAttribute("onclick", foobarPluginProps.goButtonOC);
		gURLBar.setAttribute("autocompletesearch", foobarPluginProps.addressBarACS);
		
		if (document.getElementById("search-popup")){
			document.getElementById("search-popup").removeEventListener("click", foobar.osePopupClick, false);
		};
		
		gURLBar.removeEventListener("keydown", foobar.handleAddressBarKeyDown, false);
		gURLBar.removeEventListener("DOMMouseScroll", foobar.addressBarManualSeChange, false);
		window.removeEventListener("load", foobar.construct, false);
		window.removeEventListener("unload", foobar.destruct, false);
		window.removeEventListener("keydown", foobar.handleWindowKeyDown, false);
	},
	osePopupClick : function(e){
		/* handles changing the current engine from the Organize Search Engines popup */
		
		foobar.changeCurrentEngine(e, null);
	},
	oseHandleFolderPopup : function(e){
		/* adds aliases to search engines in the Organize Search Engines popup */
		
		/* e is either the 'search-popup', or a mouse hover event for a folder within the popup */
		var pop = (e.target) ? e.target : e;
		
		/* set all the aliases for engines found in current popup */
		var engines = foobarPluginProps.searchService.getVisibleEngines({}),
			engineItems = pop.getElementsByClassName("searchbar-engine-menuitem");
		
		for (var x=0;x<engineItems.length;x++){
			for (var y=0;y<engines.length;y++){
				if (engineItems[x].getAttribute("label") == engines[y].name){
					if (engines[y].alias != null && engines[y].alias != ""){
						engineItems[x].setAttribute("acceltext", foobarPluginProps.engineDelimiter + engines[y].alias);
					};
				};
			};
		};
		
		/* set oseHandleFolderPopup for all folders found in current popup */
		var folderItems = pop.getElementsByClassName("bookmark-item");
		for (var x=0;x<folderItems.length;x++){
			folderItems[x].addEventListener("popupshowing", foobar.oseHandleFolderPopup, false);
		};
	},
	addressbarIconClick : function(e){
		/* function that's called when user clicks the address bar widget icon */
		
		if (e.button == 0){
			if (document.getElementById("search-popup")){
				/* customize popup for the plugin Organize Search Engines */
				/* handle aliases */
				foobar.oseHandleFolderPopup(document.getElementById("search-popup"));
				
				/* add the click event every time, because OSE seems to erase it, and then open the popup */
				document.getElementById("search-popup").addEventListener("click", foobar.osePopupClick, false);
				document.getElementById("search-popup").openPopup(e.target, "after_end", 5, 2, false, false);
			}else{
				/* use our own popup */
				foobar.setAddressBarWidget();
				document.getElementById("foobar-sePopup").openPopup(e.target, "after_end", 5, 2, false, false);
			};
		};
	},
	manageEngines : function(){
		/* function that's called when user clicks the 'Manage Engines' menu item in the address bar widget popup menu */
		
		openDialog("chrome://browser/content/search/engineManager.xul", "_blank", "chrome,dialog,modal,centerscreen");
		foobar.setAddressBarWidget();
	},
	changeCurrentEngine : function(e, indexMod){
		/* function that's called when user changes the current search engine */
		
		if (e && e.originalTarget){
			/* engine sent */
			var newEngine = foobarPluginProps.searchService.getEngineByName(e.originalTarget.label);
			
			if (newEngine){
				foobarPluginProps.searchService.currentEngine = newEngine;
				focusAndSelectUrlBar();
			};
		}else if (indexMod){
			/* engine index sent */
			var engines = foobarPluginProps.searchService.getVisibleEngines({}), newIndex = 0;
			
			for (var x=0;x<engines.length;x++){
				if (engines[x] == foobarPluginProps.searchService.currentEngine){
					newIndex = (x + indexMod);
				};
			};
			
			for (var x=0;x<engines.length;x++){
				if (x == newIndex){
					foobarPluginProps.searchService.currentEngine = engines[x];
				};
			};
		};
		
		foobar.setAddressBarWidget();
	},
	addOpenSearchEngine : function(e){
		if (e.originalTarget.getAttribute("class").indexOf("addengine-item") > -1){
			var type = Components.interfaces.nsISearchEngine.DATA_XML;
			foobarPluginProps.searchService.addEngine(e.originalTarget.getAttribute("uri"), type, e.originalTarget.getAttribute("src"), false);
		};
	},
	setAddressBarWidget : function(){
		/* configures the address bar widget with the list of usable search engines and sets the icon to represent the current engine */
		
		/* search engines */
		/* remove the existing list */
		if (document.getElementById("foobar-sEngineList").hasChildNodes()){
			var existingItems = document.getElementById("foobar-sEngineList").childNodes;
			
			for (var x=existingItems.length-1;x>=0;x--){
				document.getElementById("foobar-sEngineList").removeChild(existingItems[x]);
			};
		};
		
		/* rebuild list */
		var engines = foobarPluginProps.searchService.getVisibleEngines({});
		
		for (var x=0;x<engines.length;x++){
			var newItem = document.createElementNS(foobarPluginProps.xulNS, "menuitem"),
				name = engines[x].name,
				iconTip = foobarPluginProps.seIconTooltip + " " + name,
				iconUri = engines[x].iconURI;
			
			newItem.setAttribute("class", "menuitem-iconic foobar-seItem");
			newItem.setAttribute("label", name);
			newItem.setAttribute("tooltiptext", iconTip);
			if (engines[x].alias){
				newItem.setAttribute("acceltext", foobarPluginProps.engineDelimiter + engines[x].alias);
			};
			if (iconUri){
				newItem.setAttribute("image", iconUri.spec);
			}else{
				newItem.setAttribute("image", foobarPluginProps.defaultIcon);
			};
			if (engines[x] == foobarPluginProps.searchService.currentEngine){
				newItem.setAttribute("selected", "true");
									
				/* set address bar icon */
				if (iconUri){
					document.getElementById("foobar-addressIcon").setAttribute("src", iconUri.spec);
				}else{
					document.getElementById("foobar-addressIcon").setAttribute("src", foobarPluginProps.defaultIcon);
				};
				document.getElementById("foobar-addressIcon").setAttribute("tooltiptext", iconTip);
			};
			
			document.getElementById("foobar-sEngineList").appendChild(newItem);
		};
		
		/* addable 'open search' engines */
		/* remove the existing list */
		if (document.getElementById("foobar-asEngineList").hasChildNodes()){
			var existingItems = document.getElementById("foobar-asEngineList").childNodes;
			
			for (var x=existingItems.length-1;x>=0;x--){
				document.getElementById("foobar-asEngineList").removeChild(existingItems[x]);
			};
		};
		
		/* rebuild list */
		var addengines = getBrowser().mCurrentBrowser.engines,
			aeSep = document.getElementById("foobar-asEngineSeparator"),
			aeList = document.getElementById("foobar-asEngineList");
		
		if (addengines && addengines.length > 0){
			if (aeSep.getAttribute("class").indexOf("hidden") > -1){
				aeSep.setAttribute("class", aeSep.getAttribute("class").replace("foobar-hidden", ""));
			};
			if (aeList.getAttribute("class").indexOf("hidden") > -1){
				aeList.setAttribute("class", aeList.getAttribute("class").replace("foobar-hidden", ""));
			};
			
			for (var i=0;i<addengines.length;i++){
				var newItem = document.createElementNS(foobarPluginProps.xulNS, "menuitem"),
					engineInfo = addengines[i],
					labelStr = foobarPluginProps.openSearchAdd + " " + engineInfo.title;
				
				newItem.setAttribute("class", "menuitem-iconic addengine-item");
				newItem.setAttribute("label", labelStr);
				newItem.setAttribute("tooltiptext", engineInfo.uri);
				newItem.setAttribute("uri", engineInfo.uri);
				newItem.setAttribute("title", engineInfo.title);
				if (engineInfo.icon){
					newItem.setAttribute("src", engineInfo.icon);
				}else{
					newItem.setAttribute("src", foobarPluginProps.defaultIcon);
				};
				
				aeList.appendChild(newItem);
			};
		}else{
			if (aeSep.getAttribute("class").indexOf("hidden") == -1){
				aeSep.setAttribute("class", aeSep.getAttribute("class") + " foobar-hidden");
			};
			if (aeList.getAttribute("class").indexOf("hidden") == -1){
				aeList.setAttribute("class", aeList.getAttribute("class") + " foobar-hidden");
			};
		};
	},
	handleAddressBarKeyDown : function(e){
		/* handles keydowns in the address bar */
		
		if (e.ctrlKey){
			/* changing current search engine */
			if ((e.keyCode == e.DOM_VK_DOWN || e.keyCode == e.DOM_VK_UP)){
				foobar.addressBarManualSeChange(e);
			};
		};
		
		if (e.altKey){
			/* jump to first autocomplete entry in the bottom set of results */
			if (e.keyCode == e.DOM_VK_DOWN){
				var bottomSetStart = -1;
				
				if (gURLBar.mController){
					for (var x=0;x<gURLBar.mController.matchCount;x++){
						try{
							var acComment = gURLBar.mController.getCommentAt(x);
							if (acComment){
								var hot = foobarPluginProps.prefManager.getBoolPref("extensions.foobar.historyOnTop");
								if ((hot && acComment == foobarPluginProps.searchSuggestTxt) || (!hot && acComment != foobarPluginProps.searchSuggestTxt)){
									bottomSetStart = x;
									break;
								};
							};
						}catch(ex){};
					};
				};
				
				if (bottomSetStart > -1){
					gURLBar.popup.selectedIndex = bottomSetStart;
					e.preventDefault();
				};
			};
		};
	},
	handleWindowKeyDown : function(e){
		/* handles keydowns in the whole window */
		
		if (e.ctrlKey){
			/* focus on the address bar for ctrl+e, like it used to focus on the search bar */
			var sbParent = document.getElementById("search-container");
			
			if (!e.altKey && e.keyCode == 69 && (!BrowserSearch.searchBar || sbParent.getAttribute("class").indexOf("foobar-hidden") > -1)){
				/* the check for altKey is because in some keyboard language layouts (like Polish) the right alt key fires as both ctrl and alt,
				   falsely firing this key combo of ctrl+e when trying to type [an 'e' with squiggly underneath] using alt+e */
				focusAndSelectUrlBar();
				e.preventDefault();
			};
		};
	},
	addressBarManualSeChange : function(e){
		/* function handles the user changing the current search engine via scroll wheel or up/down arrows */
		
		var doSend = false, index = 0;
		
		if (e.keyCode && e.ctrlKey){
			/* key */
			switch (e.keyCode){
				case e.DOM_VK_DOWN:
					doSend = true;
					index = 1;
					break;
				case e.DOM_VK_UP:
					doSend = true;
					index = -1;
					break;
				default:
					break;
			};
		};
		
		if (!e.keyCode && (!foobarPluginProps.prefManager.getBoolPref("extensions.foobar.ctrlscroll") || e.ctrlKey)){
			/* scroll wheel */
			doSend = true;
			index = (e.detail < 0) ? -1 : 1;
		};
		
		if (doSend){
			foobar.changeCurrentEngine(null, index);
			e.preventDefault();
		};
	},
	handleAddressBarEntry : function(e){
		/* function handles a search or url navigation from the address bar */
		
		/* 'canonize' the value - returns pre/suffixed URLs when things like ctrl+enter are used */
		var cURL = gURLBar._canonizeURL(e), abText = cURL[0];
		
		if (abText && abText != ""){
			if (foobarPluginProps.foobarUtils.stringParser.isNavigable(abText)){
				/* navigate */
				gURLBar.handleCommand(e);
			}else{
				/* search */
				var enginesToUse = [],
					abTextMod = foobarPluginProps.foobarUtils.stringParser.txtSearchObject(abText);
				
				if (abTextMod.length == 1){
					/* standard search with default engine */
					enginesToUse.push(foobarPluginProps.searchService.currentEngine);
				}else{
					/* search with engine(s) other than default */
					var engines = foobarPluginProps.searchService.getVisibleEngines({});
					
					for (ge in abTextMod[1]){
						var foundAlias = false;
						
						for (en in engines){
							if (engines[en].alias && engines[en].alias == abTextMod[1][ge]){
								enginesToUse.push(engines[en]);
								foundAlias = true;
								break;
							};
						};
						
						if (!foundAlias){
							for (en in engines){
								if (engines[en].name.toLowerCase().indexOf(abTextMod[1][ge].toLowerCase()) == 0){
									enginesToUse.push(engines[en]);
									break;
								};
							};
						};
					};
				};
				
				if (enginesToUse.length == 0){
					/* no matches found - do normal address bar function */
					gURLBar.handleCommand(e);
				}else{
					var openInCurrentTab = (!foobarPluginProps.prefManager.getBoolPref("browser.search.openintab") || (gBrowser.contentDocument && gBrowser.contentDocument.location == "about:blank")),
						isFirstTab = true;
					
					/* alt+enter will do the opposite of the usual - but just this specific time */
					if (e.altKey){
						openInCurrentTab = !openInCurrentTab;
					};
					
					for (engine in enginesToUse){
						var submission = enginesToUse[engine].getSubmission(abTextMod[0], null);
						
						if (submission.uri){
							if (openInCurrentTab){
								loadURI(submission.uri.spec, null, submission.postData, false);
							}else{
								if (isFirstTab){
									gURLBar.handleRevert(); /* user entered search query over the current tab's URL - revert back to URL */
									gBrowser.selectedTab = gBrowser.addTab("about:blank");
									loadURI(submission.uri.spec, null, submission.postData, false);
								}else{
									gBrowser.loadOneTab(submission.uri.spec, null, null, submission.postData, null, false);
								};
							};
							
							openInCurrentTab = false;
							isFirstTab = false;
						};
					};
				};
			};
			
			/* that darned popup just loves to hang around - kill it, but wait for it or it'll sneak up on you */
			foobar.timeoutSetter(function(){ gURLBar.popup.closePopup(); }, 300);
		};
	},
	setPrefs : function(){
		/* search bar */
		if (BrowserSearch.searchBar){
			var sbParent = document.getElementById("search-container");
			
			if (foobarPluginProps.prefManager.getBoolPref("extensions.foobar.hidesearchbar")){
				sbParent.setAttribute("class", sbParent.getAttribute("class") + " foobar-hidden");
			}else{
				sbParent.setAttribute("class", sbParent.getAttribute("class").replace(" foobar-hidden", ""));
			};
		};
		
		/* address bar autocomplete popup size */
		var urlMaxRows = (foobarPluginProps.prefManager.getBoolPref("extensions.foobar.suggestrich")) ? 8 : 20;
		gURLBar.setAttribute("maxrows", Math.min(urlMaxRows, (foobarPluginProps.prefManager.getIntPref("extensions.foobar.searchsuggestnum") + foobarPluginProps.prefManager.getIntPref("extensions.foobar.urlsuggestnum"))));
		
		/* address bar autocomplete popup style */
		/* note: it seems that changing the 'autocompletepopup' attribute while Firefox is running does nothing - it only takes effect at load time */
		if (!foobarPluginProps.prefManager.getBoolPref("extensions.foobar.suggestrich")){
			gURLBar.setAttribute("autocompletepopup", foobarPluginProps.popSimple);
		};
		
		/* others */
		foobarPluginProps.engineDelimiter = foobarPluginProps.prefManager.getCharPref("extensions.foobar.searchenginedelimiter");
	},
	timeoutSetter : function(f, ms){
		return setTimeout(f, ms);
	}
};

/* properties */
var foobarPluginProps = {
	prefManager :			null,
	searchService :			null,
	stringService :			null,
	localeService :			null,
	stringBundle :			null,
	observerService :		null,
	foobarUtils :			null,
	secObserver :			null,
	preferanceObserver :	null,
	popObserver :			null,
	goButton :				null,
	pObservTimeout :		null,
	seIconTooltip :			"",
	openSearchAdd :			"",
	addressBarOTE :			"",
	goButtonOC :			"",
	addressBarACS :			"",
	searchSuggestTxt :		"",
	emptySearch1 :			"",
	emptySearch2 :			"",
	engineDelimiter :		"/",
	xulNS :					"http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
	defaultIcon :			"chrome://foobar/skin/images/defaultEngineIcon.png",
	seMod :					"browser-search-engine-modified",
	pObserv :				"places-autocomplete-feedback-updated",
	popRich :				"PopupAutoCompleteRichResult",
	popSimple :				"PopupAutoComplete"
};

/* observervation deck */
window.addEventListener("load", foobar.construct, false);
window.addEventListener("unload", foobar.destruct, false);
window.addEventListener("keydown", foobar.handleWindowKeyDown, false);

/* observer for search engine changes */
function foobarPluginSearchEngineObserver(){
	this.register();
};

foobarPluginSearchEngineObserver.prototype = {
	observe : function(subject, topic, data){
		if (topic == foobarPluginProps.seMod){
			switch (data){
				case "engine-removed":
				case "engine-added":
				case "engine-changed":
					foobar.setAddressBarWidget();
					break;
				case "engine-current":
					foobar.changeCurrentEngine(subject);
					break;
				default:
					break;
			};
		};
	},
	register : function(){
		foobarPluginProps.observerService.addObserver(this, foobarPluginProps.seMod, false);
	},
	unregister : function(){
		foobarPluginProps.observerService.removeObserver(this, foobarPluginProps.seMod);
	}
};

/* observer for changes to the autocomplete popup */
function foobarPluginPopupObserver(){
	this.register();
};

foobarPluginPopupObserver.prototype = {
	observe : function(subject, topic, data){
		clearTimeout(foobarPluginProps.pObservTimeout);
		
		foobarPluginProps.pObservTimeout = foobar.timeoutSetter(function(){
			var doClose = false;
			
			if (gURLBar.mController){
				if (gURLBar.mController.matchCount == 0){
					/* sometimes the popup likes to hang around for no reason - close it! */
					doClose = true;
				}else{
					try{
						/* sometimes, the popup either lies and says it has matches when it doesn't, or is a jerk and refuses to show the matches and just displays as blank.
							when this happens, these calls to getValueAt and getCommentAt will fail, and we can close it accordingly */
						var testingPopup = gURLBar.mController.getValueAt(0);
						testingPopup = gURLBar.mController.getCommentAt(0);
					}catch(ex){
						doClose = true;
					};
				};
			};
			
			if (doClose){
				gURLBar.popup.closePopup();
			};
		}, 100);
	},
	register : function(){
		foobarPluginProps.observerService.addObserver(this, foobarPluginProps.pObserv, false);
	},
	unregister : function(){
		foobarPluginProps.observerService.removeObserver(this, foobarPluginProps.pObserv);
	}
};

/* observer for preference changes */
function foobarPluginPrefObserver(){
	this.register();
};

foobarPluginPrefObserver.prototype = {
	observe : function(subject, topic, data){
		if (topic == "nsPref:changed"){
			foobar.setPrefs();
		};
	},
	register : function(){
		this._branch = foobarPluginProps.prefManager.getBranch("extensions.foobar.");
		this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this._branch.addObserver("", this, false);
	},
	unregister : function(){
		if (this._branch){
			this._branch.removeObserver("", this);
		};
	}
};