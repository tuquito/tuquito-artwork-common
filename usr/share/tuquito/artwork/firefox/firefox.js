// This is the Debian specific preferences file for Mozilla Firefox
// You can make any change in here, it is the purpose of this file.
// You can, with this file and all files present in the
// /etc/firefox/pref directory, override any preference that is
// present in /usr/lib/firefox/defaults/pref directory.
// While your changes will be kept on upgrade if you modify files in
// /etc/firefox/pref, please note that they won't be kept if you
// do them in /usr/lib/firefox/defaults/pref.

pref("extensions.update.enabled", true);

// Use LANG environment variable to choose locale
pref("intl.locale.matchOS", true);

// Disable default browser checking.
pref("browser.shell.checkDefaultBrowser", false);

// Prevent EULA dialog to popup on first run
pref("browser.EULA.override", true);

// identify tuquito @ yahoo searchplugin
pref("browser.search.param.yahoo-fr", "tuquito");

/*
 * Mejoras Tuquito
 */
// Set the UserAgent
pref("general.useragent.vendor", "Tuquito");
pref("general.useragent.vendorSub", "5");
pref("general.useragent.vendorComment", "Pampa");

// Disable ipv6
pref("network.dns.disableIPv6", true);

//Delay de impresión 0
pref("nglayout.initialpaint.delay", 0);

// prefetch
pref("network.prefetch-next", false);

//acelerar navegación
pref("network.http.pipelining", true);
pref("network.http.pipelining.maxrequests", 30);
pref("network.http.max-connections", 96);
pref("network.http.max-connections-per-server", 24);
pref("network.http.max-persistent-connections-per-server", 8);
pref("network.http.pipelining.ssl", true);
pref("network.http.proxy.pipelining", true);

// activa el regreso con la tecla backspace
pref("browser.backspace_action", 0);

// ignorar página de las notas de la versión de Mozilla al inicio
pref("browser.startup.homepage_override.mstone", "ignore");

//autocompletar barra
pref("browser.urlbar.autoFill", true);

// notificador integrado
pref("browser.download.manager.showAlertOnComplete", false);

// reduce el numero de pestañas y ventanas que puedes restaurar
pref("browser.sessionstore.max_tabs_undo", 4);
pref("browser.sessionstore.max_windows_undo", 1);

//reduce el resultado a mostrar en la barra
pref("browser.urlbar.maxRichResults", 6);

// mejora el comportamiento del navegador
pref("dom.disable_window_open_feature.menubar", true);
pref("dom.disable_window_move_resize", true);
pref("dom.disable_window_open_feature.titlebar", true);
pref("dom.disable_window_open_feature.toolbar", true);

// desactiva el tiempo de espera para instalar addon
pref("security.dialog_enable_delay", 0);

// colores enriquecidos
pref("gfx.color_management.enabled", true);

// sonido al finalizar descarga
pref("downbar.function.soundOnComplete", 1);
