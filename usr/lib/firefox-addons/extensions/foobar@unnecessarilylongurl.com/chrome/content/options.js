/* options definition */
var foobarOptions = {
	construct : function(){
		/* the initializing function */
		
		/* setup services */
		foobarOptionsProps.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		foobarOptionsProps.stringService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
		foobarOptionsProps.localeService = Components.classes["@mozilla.org/intl/nslocaleservice;1"].getService(Components.interfaces.nsILocaleService);
		foobarOptionsProps.stringBundle = foobarOptionsProps.stringService.createBundle("chrome://foobar/locale/strings.properties", foobarOptionsProps.localeService.getApplicationLocale());
		
		/* setup foobar-urlSuggestList */
		foobarOptionsProps.urlSuggestParent = document.getElementById("foobar-urlSuggest");
		foobarOptionsProps.urlSuggestList = document.getElementById("foobar-urlSuggestList");
		
		var newItem1 = document.createElementNS(foobarOptionsProps.xulNS, "menuitem"),
			newItem2 = document.createElementNS(foobarOptionsProps.xulNS, "menuitem"),
			newItem3 = document.createElementNS(foobarOptionsProps.xulNS, "menuitem"),
			newItem4 = document.createElementNS(foobarOptionsProps.xulNS, "menuitem"),
			sIndex = 3;
		
		newItem1.setAttribute("label", foobarOptionsProps.stringBundle.GetStringFromName("foobar.ops.urlsuggest1"));
		newItem1.setAttribute("value", "0");
		newItem2.setAttribute("label", foobarOptionsProps.stringBundle.GetStringFromName("foobar.ops.urlsuggest2"));
		newItem2.setAttribute("value", "1");
		newItem3.setAttribute("label", foobarOptionsProps.stringBundle.GetStringFromName("foobar.ops.urlsuggest3"));
		newItem3.setAttribute("value", "2");
		newItem4.setAttribute("label", foobarOptionsProps.stringBundle.GetStringFromName("foobar.ops.urlsuggest4"));
		newItem4.setAttribute("value", "3");
		
		foobarOptionsProps.urlSuggestList.appendChild(newItem1);
		foobarOptionsProps.urlSuggestList.appendChild(newItem2);
		foobarOptionsProps.urlSuggestList.appendChild(newItem3);
		foobarOptionsProps.urlSuggestList.appendChild(newItem4);
		
		if (foobarOptionsProps.prefManager.getBoolPref("browser.urlbar.autocomplete.enabled")){
			switch (foobarOptionsProps.prefManager.getIntPref("browser.urlbar.default.behavior")){
				case 0:
					sIndex = 0;
					break;
				case 1:
					sIndex = 1;
					break;
				case 2:
					sIndex = 2;
					break;
				default:
					break;
			};
		};
		
		foobarOptionsProps.urlSuggestParent.selectedIndex = sIndex;
		
		/* setup other */
		document.getElementById("foobar-ssNum").min = 1;
		document.getElementById("foobar-ssNum").max = 10;
		
		document.getElementById("foobar-usNum").min = 1;
		document.getElementById("foobar-usNum").max = 10;
		
		document.getElementById("foobar-seDelimit").maxLength = 1;
	},
	destruct : function(){
		/* the destroying function */
		
		/* not implimented */
	},
	doAccept : function(){
		/* function sets any preferences not auto-set by the prefwindow */
		
		var urlAutoCom = true, urlAutoComType = 0;
		
		/* foobar-urlSuggestList */
		switch (foobarOptionsProps.urlSuggestParent.selectedIndex){
			case 0:
				break;
			case 1:
				urlAutoComType = 1;
				break;
			case 2:
				urlAutoComType = 2;
				break;
			default:
				urlAutoCom = false;
				break;
		};
		
		foobarOptionsProps.prefManager.setBoolPref("browser.urlbar.autocomplete.enabled", urlAutoCom);
		foobarOptionsProps.prefManager.setIntPref("browser.urlbar.default.behavior", urlAutoComType);
	},
	restartWarn : function(pref){
		/* function warns the user that changing this or that preference won't take effect until after a restart */
		
		if (pref == "acStyle" && !foobarOptionsProps.acsHasBeenWarned){
			foobarOptionsProps.acsHasBeenWarned = true;
			document.documentElement.openSubDialog("chrome://foobar/content/options.restartwarn.xul", "", null);
		};
	}
};

/* properties */
var foobarOptionsProps = {
	prefManager :			null,
	stringService :			null,
	localeService :			null,
	stringBundle :			null,
	urlSuggestParent :		null,
	urlSuggestList :		null,
	acsHasBeenWarned :		false,
	xulNS :					"http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
};