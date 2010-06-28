/*
	For Debugging:
	
	var ConsSrv = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
	ConsSrv.logStringMessage("foo");
*/

/* autocomplete service definition */
function FoobarAutocomplete(){
	/* the initializing function */
	
	/* setup services */
	foobarAutocompleteProps.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	foobarAutocompleteProps.searchService = Components.classes['@mozilla.org/browser/search-service;1'].getService(Components.interfaces.nsIBrowserSearchService);
	foobarAutocompleteProps.observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
	foobarAutocompleteProps.acSearchService = Components.classes["@mozilla.org/autocomplete/search;1?name=search-autocomplete"].createInstance(Components.interfaces.nsIAutoCompleteSearch);
	foobarAutocompleteProps.acHistoryService = Components.classes["@mozilla.org/autocomplete/search;1?name=history"].createInstance(Components.interfaces.nsIAutoCompleteSearch);
	foobarAutocompleteProps.stringService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
	foobarAutocompleteProps.localeService = Components.classes["@mozilla.org/intl/nslocaleservice;1"].getService(Components.interfaces.nsILocaleService);
	foobarAutocompleteProps.stringBundle = foobarAutocompleteProps.stringService.createBundle("chrome://foobar/locale/strings.properties", foobarAutocompleteProps.localeService.getApplicationLocale());
	foobarAutocompleteProps.foobarUtils = Components.classes["@foobar.com/utils;1"].getService().wrappedJSObject;
	
	/* listeners */
	foobarAutocompleteProps.preferanceObserver = new foobarAutocompletePrefObserver();
	
	/* setup other */
	foobarAutocompleteProps.searchSuggestTxt = foobarAutocompleteProps.stringBundle.GetStringFromName("foobar.searchSuggestTxt");
	
	/* preferences */
	setFoobarAutocompletePrefs();
};

FoobarAutocomplete.prototype = {
	QueryInterface : function (iid){
		if (iid.equals(Components.interfaces.nsIAutoCompleteSearch) || iid.equals(Components.interfaces.nsISupports)){
			return this;
		};
		
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
	_listener : null,
	_historyResult : null,
	_searchResult : null,
	_foobarResult : null,
	startSearch : function(searchString, searchParam, previousResult, listener){
		/* nsIAutoCompleteSearch startSearch override */
		
		/* setup */
		var self = this;
		this._listener = listener;
		
		/* handle engines given in the search string */
		var ssMod = foobarAutocompleteProps.foobarUtils.stringParser.txtSearchObject(searchString);
		if (ssMod.length == 2){
			searchString = ssMod[0];
		};
		
		if (!this._foobarResult){
			this._foobarResult = new FoobarAutocompleteSearchResult(searchString);
		};
		
		/* history/bookmarks */
		foobarAutocompleteProps.acHistoryService.startSearch(searchString, searchParam, previousResult, new foobarAutocompleteSearchObserver({ handleResult : function(s, r){ self.onHasResult("h", s, r); } }));
		
		/* search suggest */
		foobarAutocompleteProps.acSearchService.startSearch(searchString, searchParam, previousResult, new foobarAutocompleteSearchObserver({ handleResult : function(s, r){ self.onHasResult("s", s, r); } }));
	},
	stopSearch : function(){
		/* nsIAutoCompleteSearch stopSearch override */
		
		foobarAutocompleteProps.acSearchService.stopSearch();
		foobarAutocompleteProps.acHistoryService.stopSearch();
		this._historyResult = null;
		this._searchResult = null;
	},
	onHasResult : function(type, search, searchResult){
		/* function handles the 'normal' autocomplete results, turning them into a foobar result set */
		
		/* history/bookmarks */
		if (type == "h"){
			if (foobarAutocompleteProps.doHistorySuggest){
				this._historyResult = searchResult;
			}else{
				this._historyResult = new FoobarAutocompleteSearchResult("");
			};
			this._foobarResult.setHistoryResult(this._historyResult);
		};
		
		/* search suggest */
		if (type == "s"){
			if (foobarAutocompleteProps.doSearchSuggest){
				this._searchResult = searchResult;
			}else{
				this._searchResult = new FoobarAutocompleteSearchResult("");
			};
			this._foobarResult.setSearchResult(this._searchResult);
		};
		
		/* return final result */
		if (this._listener){
			this._listener.onSearchResult(this, this._foobarResult);
			
			foobarAutocompleteProps.observerService.notifyObservers(null, "places-autocomplete-feedback-updated", "");
		};
	}
};

/* autocomplete service registration */
var FoobarAutocompleteModule = {
	firstTime : true,
	registerSelf : function(compMgr, fileSpec, location, type){
		if (this.firstTime){
			this.firstTime = false;
			throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
		};
		
		compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		compMgr.registerFactoryLocation(FOOBAR_AUTOCOMPLETE_CLASS_ID, FOOBAR_AUTOCOMPLETE_CLASS_NAME, FOOBAR_AUTOCOMPLETE_CONTRACT_ID, fileSpec, location, type);
	},
	getClassObject : function(compMgr, cid, iid){
		if (!cid.equals(FOOBAR_AUTOCOMPLETE_CLASS_ID)){
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
			
			return (new FoobarAutocomplete()).QueryInterface(iid);
		}
	},
    canUnload : function(compMgr){
        return true;
    }
};

function NSGetModule(compMgr, fileSpec){
	return FoobarAutocompleteModule;
};

/* properties */
const FOOBAR_AUTOCOMPLETE_CLASS_ID = Components.ID("{BE1903C2-16A7-11DF-A9EC-396756D89593}");
const FOOBAR_AUTOCOMPLETE_CLASS_NAME = "Foobar Autocomplete Service";
const FOOBAR_AUTOCOMPLETE_CONTRACT_ID = "@mozilla.org/autocomplete/search;1?name=foobar-autocomplete";

var foobarAutocompleteProps = {
	prefManager :			null,
	searchService :			null,
	acSearchService :		null,
	acHistoryService :		null,
	stringService :			null,
	localeService :			null,
	stringBundle :			null,
	foobarUtils :			null,
	preferanceObserver :	null,
	observerService :		null,
	doHistorySuggest :		true,
	doSearchSuggest :		true,
	searchSuggestTxt :		"",
	engineDelimiter :		"/",
	defaultIcon :			"chrome://foobar/skin/images/defaultEngineIcon.png"
};

function setFoobarAutocompletePrefs(){
	foobarAutocompleteProps.doHistorySuggest = foobarAutocompleteProps.prefManager.getBoolPref("browser.urlbar.autocomplete.enabled");
	foobarAutocompleteProps.doSearchSuggest = foobarAutocompleteProps.prefManager.getBoolPref("browser.search.suggest.enabled");
	foobarAutocompleteProps.engineDelimiter = foobarAutocompleteProps.prefManager.getCharPref("extensions.foobar.searchenginedelimiter");
};

/* Foobar's own autocomplete result */
function FoobarAutocompleteSearchResult(searchString){
	this._searchString = searchString;
};

FoobarAutocompleteSearchResult.prototype = {
	QueryInterface : function (iid){
		if (iid.equals(Components.interfaces.nsIAutoCompleteResult) || iid.equals(Components.interfaces.nsISupports)){
			return this;
		};
		
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
	_searchString : "",
	_searchResult : 0,
	_errorDescription : "",
	_searchResults : null,
	_historyResults : null,
	setSearchResult : function(r){
		if (r){
			var len = r.matchCount, tot = foobarAutocompleteProps.prefManager.getIntPref("extensions.foobar.searchsuggestnum") || 3;
			
			if (len > tot){
				for (var x=len-1;x>=tot;x--){
					r.removeValueAt(x, false);
				};
			};
		};
		
		this._searchResults = r;
	},
	setHistoryResult : function(r){
		if (r){
			var len = r.matchCount, tot = foobarAutocompleteProps.prefManager.getIntPref("extensions.foobar.urlsuggestnum") || 3;
			
			if (len > tot){
				for (var x=len-1;x>=tot;x--){
					r.removeValueAt(x, false);
				};
			};
		};
		
		this._historyResults = r;
	},
	get searchString(){
		return this._searchString;
	},
	get searchResult(){
		if (this.matchCount == 0){
			return Components.interfaces.nsIAutoCompleteResult.RESULT_NOMATCH;
		}else{
			return Components.interfaces.nsIAutoCompleteResult.RESULT_SUCCESS;
		};
	},
	get defaultIndex(){
		return 0;
	},
	get errorDescription(){
		/* TODO: set this for really reals later (including returning FAILURES in "get searchResult") */
		return this._errorDescription;
	},
	get matchCount(){
		var searchCount = (this._searchResults) ? this._searchResults.matchCount : 0,
			historyCount = (this._historyResults) ? this._historyResults.matchCount : 0;
		
		return (searchCount + historyCount);
	},
	getValueAt : function(index){
		var comboResult = this.combinationResult(index);
		
		if (comboResult){
			return this[comboResult.type].getValueAt(comboResult.index);
		};
		
		return "";
	},
	getCommentAt : function(index){
		var comboResult = this.combinationResult(index);
		
		if (comboResult && comboResult.type == "_historyResults"){
			return this[comboResult.type].getCommentAt(comboResult.index);
		};
		
		return foobarAutocompleteProps.searchSuggestTxt;
	},
	getStyleAt : function(index){
		return null;
	},
	getImageAt : function(index){
		var comboResult = this.combinationResult(index);
		
		if (comboResult && comboResult.type == "_historyResults"){
			return this[comboResult.type].getImageAt(comboResult.index);
		};
		
		if (foobarAutocompleteProps.searchService.currentEngine.iconURI){
			return foobarAutocompleteProps.searchService.currentEngine.iconURI.spec;
		};
		
		return foobarAutocompleteProps.defaultIcon;
	},
	removeValueAt : function(index, removeFromDatabase){
		var comboResult = this.combinationResult(index);
		
		if (comboResult){
			this[comboResult.type].removeValueAt(comboResult.index);
		};
	},
	combinationResult : function(index){
		var topResults = "_historyResults", bottomResults = "_searchResults";
		
		if (!foobarAutocompleteProps.prefManager.getBoolPref("extensions.foobar.historyOnTop")){
			topResults = "_searchResults";
			bottomResults = "_historyResults";
		};
		
		if (this[topResults] && index < this[topResults].matchCount){
			return { type : topResults, index : index };
		}else if (this[bottomResults]){
			var topCount = (this[topResults]) ? this[topResults].matchCount : 0;
			return { type : bottomResults, index : (index - topCount) };
		}else{
			return null;
		};
	}
};

/* observation deck */
/* observer for when autocomplete/suggest results are returned */
function foobarAutocompleteSearchObserver(callback){
	this._callback = callback;
};

foobarAutocompleteSearchObserver.prototype = {
	QueryInterface : function(iid){
		if(iid === Components.interfaces.nsIAutoCompleteObserver || iid === Components.interfaces.nsISupports){
			return this;
		};
		
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
	_callback : null,
	onSearchResult : function(search, searchResult){
		if (this._callback){
			this._callback.handleResult(search, searchResult);
		};
	}
};

/* observer for preference changes */
function foobarAutocompletePrefObserver(){
	this.register();
};

foobarAutocompletePrefObserver.prototype = {
	observe : function(subject, topic, data){
		if (topic == "nsPref:changed"){
			setFoobarAutocompletePrefs();
		};
	},
	register : function(){
		var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch2);
		prefService.addObserver("browser.urlbar.autocomplete.enabled", this, false);
		prefService.addObserver("browser.search.suggest.enabled", this, false);
		prefService.addObserver("extensions.foobar.searchenginedelimiter", this, false);
	},
	unregister : function(){
		/* not implimented */
	}
};