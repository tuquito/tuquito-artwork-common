//
user_pref("extensions.update.enabled", true);

// Use LANG environment variable to choose locale
user_pref("intl.locale.matchOS", true);

// Disable default browser checking.
user_pref("browser.shell.checkDefaultBrowser", false);

// Prevent EULA dialog to popup on first run
user_pref("browser.EULA.override", true);

// identify tuquito @ yahoo searchplugin
user_pref("browser.search.param.yahoo-fr", "tuquito");

// Set the UserAgent
user_pref("general.useragent.vendor", "Tuquito");
user_pref("general.useragent.vendorSub", "6");
user_pref("general.useragent.vendorComment", "Guaraní");

// Activate the backspace key for browsing back
user_pref("browser.backspace_action", 0);

// Ignore Mozilla release notes startup pages
user_pref("browser.startup.homepage_override.mstone", "ignore");

// Homepage
user_pref("browser.startup.homepage", "http://tuquito.org.ar/start/guarani");

// Save tabs before exiting
user_pref("browser.showQuitWarning", true);

// SmothScroll
user_pref("general.smoothScroll", true);
