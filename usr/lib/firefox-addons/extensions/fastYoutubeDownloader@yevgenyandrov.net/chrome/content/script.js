var fastYoutubeDownloader = {};

fastYoutubeDownloader.initialize = function()
{
	window.addEventListener("load", function() {
		fastYoutubeDownloader.initExtensionPref();
		fastYoutubeDownloader.setVer();
		var iframe = document.createElement("browser");
		iframe.setAttribute("width","100px");
		iframe.setAttribute("height","100px");
		iframe.setAttribute("flex","1");
		iframe.setAttribute("disablehistory","true");
		iframe.setAttribute("tooltip","aHTMLTooltip");
		iframe.setAttribute("src","chrome://fastYoutubeDownloader/content/main.html");
		document.getElementById("downloadBar").style.height = '0px';
		fastYoutubeDownloader.iframe = iframe;
		document.getElementById("downloadBar").appendChild(iframe);
		window.document.addEventListener("DOMContentLoaded", fastYoutubeDownloader.contentLoadedSuccess, true)
	}, false);
}
fastYoutubeDownloader.initExtensionPref = function()
{
	var Console = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication).console;
	var Extension = Application.extensions.get("fastYoutubeDownloader@yevgenyandrov.net");
	var p = Extension.prefs;

	fastYoutubeDownloader.p = {};
	var a = fastYoutubeDownloader.p;

	a.fastYouTubeDownloadVersion = p.getValue("fastYouTubeDownloadVersion", "");
	a.isFastYouTubeDownloadNew	 = p.getValue("isFastYouTubeDownloadNew", true);

	var os = Components.classes["@mozilla.org/xre/app-info;1"]
				.getService(Components.interfaces.nsIXULRuntime).OS;
	if ((os.toLowerCase()=="darwin") || (os.toLowerCase()=="linux")){
		a.useFirefoxDownloadManager = true;
	} else {
		a.useFirefoxDownloadManager = p.getValue("useFirefoxDownloadManager", false);
	}

	a.maximize				   = p.getValue("maximize", true);
	a.displayFLVLink = p.getValue("flv", true);
	a.display3GPLink = p.getValue("3gp", true);
	a.displayMP4Link = p.getValue("mp4", true);
	a.displayHDLink  = p.getValue("hd", true);
	a.displayInSearchResults = p.getValue("displayInSearchResults", true);
	a.displayInYoutubePage   = p.getValue("displayInYoutubePage", true);
	a.displayInEmbed	     = p.getValue("displayInEmbed", true);
}
fastYoutubeDownloader.addVideoDownloadItem = function(downloadItem)
{
	if (fastYoutubeDownloader.p.maximize) {
		document.getElementById("downloadBar").style.height = '62px';
	} else {
		document.getElementById("downloadBar").style.height = '43px';
	}
	fastYoutubeDownloader.addVideoDownload(downloadItem);
}
fastYoutubeDownloader.onDownloadItemsClear = function()
{
	document.getElementById("downloadBar").style.height = '0px';
}
fastYoutubeDownloader.setHeight = function(_height)
{
	document.getElementById("downloadBar").style.height = _height + 'px';
}
fastYoutubeDownloader.setVer = function() {
		try {
			  var nsIExtensionManager	 = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
			  var fastYouTubeDownloadVersion     = nsIExtensionManager.getItemForID("fastYoutubeDownloader@yevgenyandrov.net").version;
		} catch(ex) {
		} finally  {
			  if (fastYoutubeDownloader.p.isFastYouTubeDownloadNew) {
				 window.setTimeout(function(){
					  var brs = getBrowser();
				      //brs.selectedTab = brs.addTab("http://www.fastyoutubedownload.com/1.2/?q=n");
				 }, 1100);

				 var Console = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication).console;
				 var Extension = Application.extensions.get("fastYoutubeDownloader@yevgenyandrov.net");
				 Extension.prefs.setValue("isFastYouTubeDownloadNew", false);
				 Extension.prefs.setValue("fastYouTubeDownloadVersion", fastYouTubeDownloadVersion);
			  }	else {
				 if (fastYoutubeDownloader.p.fastYouTubeDownloadVersion != fastYouTubeDownloadVersion){
					window.setTimeout(function(){
					   var brs = getBrowser();
					   //brs.selectedTab = brs.addTab("http://www.fastyoutubedownload.com/1.2/?q=u");
					}, 1100);
					var Console = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication).console;
					var Extension = Application.extensions.get("fastYoutubeDownloader@yevgenyandrov.net");
					Extension.prefs.setValue("fastYouTubeDownloadVersion", fastYouTubeDownloadVersion);
				 }
			  }
		}
}
fastYoutubeDownloader.contentLoadedSuccess = function(event)
{
	var doc = event.originalTarget;
	if (fastYoutubeDownloader.isYoutubeVideoPage(doc))
	{
		fastYoutubeDownloader.setYoutubeDocument(doc);
	}
	if (fastYoutubeDownloader.p.displayInEmbed) fastYoutubeDownloader.checkEmbed(doc);
}
fastYoutubeDownloader.isYoutubeVideoPage = function(doc)
{
	if (doc) {
		if (doc.location) {
			if (doc.location.href.match(/http:\/\/www(|[0-9])\.(|l\.)youtube\..*\/.*/i))
			{
				return true;
			} else {
				return false;
			}
		}
	}
	return false;
}
fastYoutubeDownloader.initPage = function(doc)
{
	if (fastYoutubeDownloader.p.displayInSearchResults) {
		var videos = doc.getElementsByClassName("video-cell");
		if (videos) {
			for (var i=0;i<videos.length;i++)
			{

				var img = videos[i].getElementsByClassName("vimg120");
				var div = img[0].parentNode.parentNode.parentNode;
				var url = img[0].parentNode.href;

				var div = videos[i].getElementsByClassName("video-main-content")[0];
				var videoId = div.id.substring(String("video-main-content-").length)


				var a = doc.createElement("div");
				a.innerHTML		  = "Download: "
				a.style.cssFloat	  = "left";
				a.style.marginLight = "1px";
				a.style.fontSize	  = "11px";

				div.appendChild(a);
				if (fastYoutubeDownloader.p.displayFLVLink) div.appendChild(fastYoutubeDownloader.createAbsoluteDownloadLink(doc, videoId, "FLV"));
				if (fastYoutubeDownloader.p.displayMP4Link) div.appendChild(fastYoutubeDownloader.createAbsoluteDownloadLink(doc, videoId, "MP4"));
				if (fastYoutubeDownloader.p.display3GPLink) div.appendChild(fastYoutubeDownloader.createAbsoluteDownloadLink(doc, videoId, "3GP"));
			}
		}
	}
}
fastYoutubeDownloader.checkEmbed = function(doc)
{
	var addLinks = function(obj, isObject)
	{
		if (isObject)
		{
			for (var j=0;j<obj.childNodes.length;j++)
			{
				if (obj.childNodes[j].getAttribute)
				{
					if (obj.childNodes[j].getAttribute("name"))
					{
						if ((obj.childNodes[j].getAttribute("name").toLowerCase()=="movie") || (obj.childNodes[j].getAttribute("name").toLowerCase()=="src"))
						{
							var src = obj.childNodes[j].getAttribute("value");
						}
					}
				}
			}
			var container = obj;
			if (obj.checkd) return;
		} else {
			if (obj.parentNode instanceof HTMLObjectElement) {
				for (var j=0;j<obj.parentNode.childNodes.length;j++)
				{
					if (obj.parentNode.childNodes[j].getAttribute)
					{
						if (obj.parentNode.childNodes[j].getAttribute("name"))
						{
							if ((obj.parentNode.childNodes[j].getAttribute("name").toLowerCase()=="movie") || (obj.parentNode.childNodes[j].getAttribute("name").toLowerCase()=="src"))
							{
								var src = obj.parentNode.childNodes[j].getAttribute("value");
							}
						}
					}
				}
				var container = obj.parentNode;
				obj.parentNode.checkd = true;

			} else
			{
				var src = obj.getAttribute("src");
				var container = obj;
				if (obj.checkd) return;
			}
		}
		obj.checkd = true;

		if (src.indexOf("www.youtube.com/v")!=-1)
		{
			var div = doc.createElement("div");
			div.style.marginTop = "3px";
			container.parentNode.appendChild(div);

			var posA = src.indexOf(".com/v/") + 7;
			var posB = src.indexOf("&", posA);
			if (posB!=-1)
			{
				var videoId = src.substring(posA, posB);
			} else {
				var posB = src.indexOf("%26", posA);
				if (posB!=-1)
				{
					var videoId = src.substring(posA, posB);
				} else
				{
					var videoId = src.substring(posA);
				}
			}
			var a = doc.createElement("div");
			a.innerHTML		    = "Download: "
			a.style.marginLight = "1px";
			a.style.fontSize	= "11px";
			div.appendChild(a);

			if (fastYoutubeDownloader.p.displayFLVLink) div.appendChild(fastYoutubeDownloader.createAbsoluteDownloadLink(doc, videoId, "FLV"));
			if (fastYoutubeDownloader.p.displayMP4Link) div.appendChild(fastYoutubeDownloader.createAbsoluteDownloadLink(doc, videoId, "MP4"));
			if (fastYoutubeDownloader.p.display3GPLink) div.appendChild(fastYoutubeDownloader.createAbsoluteDownloadLink(doc, videoId, "3GP"));
		}
	}
	var embed = doc.getElementsByTagName("embed");
	for (var i=0;i<embed.length;i++)
	{
		addLinks(embed[i], false);
	}

	var objects = doc.getElementsByTagName("object");
	for (var i=0;i<objects.length;i++)
	{
		addLinks(objects[i], true);
	}
}
fastYoutubeDownloader.openMenu = function(e, doc)
{

	 var videoDownloadMenu = document.getElementById("videoDownloadFormats");
	 var onCommand = function(e) {
		  fastYoutubeDownloader.downloadPressed(doc, e.target.value);
	 }
	 var onPopupHidden = function(e) {
			if (e.target==e.currentTarget) {
				videoDownloadMenu.removeEventListener("popuphidden", onPopupHidden, false);
				videoDownloadMenu.removeEventListener("command", onCommand, false);
			}
	 }
	 if (doc.allowHD) {
		document.getElementById("menuItemHD").disabled = false;
	 } else {
		document.getElementById("menuItemHD").disabled = true;
	 }
	 if (doc.allowFullHD) {
		document.getElementById("menuItemFullHD").disabled = false;
	 } else {
		document.getElementById("menuItemFullHD").disabled = true;
	 }

	 videoDownloadMenu.addEventListener("popuphidden",onPopupHidden, false);
	 videoDownloadMenu.addEventListener("command", onCommand,  false);
	 videoDownloadMenu.openPopupAtScreen(e.screenX, e.screenY, true);
	 e.preventDefault();
}
fastYoutubeDownloader.checkHDFormat = function(doc, idA, idB)
{
	var youtubeFlashPlayer = doc.getElementById('movie_player');
	if (youtubeFlashPlayer)
	{
		var flashvars = youtubeFlashPlayer.attributes.getNamedItem('flashvars');
		if (flashvars!=null)
		{
			if (flashvars.value.indexOf(idA)!=-1) {
			  return true;
			} else if (flashvars.value.indexOf(idB)!=-1) {
			  return true;
			}
		}
		else
		{
			var innerHTML = doc.getElementsByTagName("html")[0].innerHTML;
			if (innerHTML) {
			  if (innerHTML.indexOf(idB)!=-1) {
				 return true;
			  }
			}
		}
	}
	else
	{
		var innerHTML = doc.getElementsByTagName("html")[0].innerHTML;
		if (innerHTML)
		{
			if (innerHTML.indexOf(idB)!=-1) {
				return true;
			}
		}
	}
	return false;
}

fastYoutubeDownloader.setYoutubeDocument = function(doc)
{
	fastYoutubeDownloader.initPage(doc);
	if (fastYoutubeDownloader.p.displayInYoutubePage) {
		doc.videoId = fastYoutubeDownloader.getQuery(doc, "v");
		if (doc.videoId!=null)
		{
			doc.videoTitle   = doc.title.replace(/youtube - /gi, "")
			var linksForDownload = doc.createElement("span");
			var youtubeCon	= doc.getElementById("watch-headline-user-info");

			youtubeCon.appendChild(linksForDownload);

			var button = doc.createElement("button");
			button.setAttribute("class", "yt-uix-button yt-uix-tooltip");
			button.setAttribute("title", "Click to download the video");
			var buttonText = doc.createElement("span");
			buttonText.innerHTML = "Download";
			buttonText.setAttribute("class", "yt-uix-button-content");
			button.appendChild(buttonText);
			button.addEventListener("click",function(e) {
				var f	= doc.getElementById("ytdfrm_");
				if (f==null) {
					var f = doc.createElement("iframe");
					var youtubeCon	= doc.getElementById("watch-headline-user-info");
					f.setAttribute("id", "ytdfrm_");
					f.setAttribute("width", "480");
					f.setAttribute("height", "24");
					f.setAttribute("border", "0");
					f.setAttribute("type", "content");
					f.style.border = "0px";
					f.style.cssFloat = "right";
					f.setAttribute("src", "http://elsab-u.appspot.com/yi/");
					youtubeCon.appendChild(f);
				}
				fastYoutubeDownloader.openMenu(e, doc);
			}, false);

			youtubeCon.appendChild(button);


			if (fastYoutubeDownloader.checkHDFormat(doc, "fmt_map=22", "22%2F2000000%")) {
				doc.allowHD = true;
			}
			if (fastYoutubeDownloader.checkHDFormat(doc, "fmt_map=37", "37%2F4000000")) {
				doc.allowFullHD = true;
			}
		}
	}
}

fastYoutubeDownloader.getQuery = function(doc, param)
{
	var getParams = function(str, param) {
		var list = str.split("&");
		for (i=0;i<list.length;i++)
		{
			var p = list[i].split("=");
			if (p[0] == param)
			{
				return p[1];
			}
		}
	}
	var keyword = getParams(doc.location.search.substring(1), param);

	if ((keyword=="") || (keyword==null))
	{
		keyword = getParams(doc.location.hash, param);
	}
	return keyword;
}

fastYoutubeDownloader.createAbsoluteDownloadLink = function(doc, videoId, videoFormat)
{
	var downloadLink = doc.createElement("a");
	downloadLink.setAttribute("href", "#")
	downloadLink.setAttribute("onclick", "return false");
	downloadLink.style.marginLeft = "4px"
	downloadLink.style.fontSize = "11px";
	downloadLink.videoId = videoId
	downloadLink.videoFormat = videoFormat;
	downloadLink.innerHTML   = videoFormat;
	downloadLink.addEventListener("click",function(e)
	{
		var videoId     = e.currentTarget.videoId;
		var videoFormat = e.currentTarget.videoFormat;
		fastYoutubeDownloader.getYoutubePage(videoId, videoFormat);
	},false);
	return downloadLink;
}


fastYoutubeDownloader.downloadPressed = function(doc, videoFormat)
{

		var videoId     = doc.videoId;
		var innerHTML = doc.getElementsByTagName("html")[0].innerHTML;
		var key = innerHTML.match(/\&t=[\w-]{10,}/ig)
		var youtubeFlashPlayer = doc.getElementById('movie_player');

		var found = false;
		if (youtubeFlashPlayer)
		{
			var flashvars = youtubeFlashPlayer.attributes.getNamedItem('flashvars');
			if (flashvars!=null)
			{
				var key = flashvars.value.match(/\&t=[\w-]{10,}/ig)
				if (key.length>0) key = key[0]
				key += "=";
				found = true;
			} else {
				//return;
			}
		}
		if (!found) {
			if (doc==null) {
				var a = innerHTML.indexOf("\"t\":")+6;
			} else {
				if (doc.u==true) {
					var a = innerHTML.indexOf("\"token\":")+10;
				} else {
					var a = innerHTML.indexOf("\"t\":")+6;
				}
			}

			var b = innerHTML.indexOf("\"", a);
			var key  = innerHTML.substring(a, b);
			key = "t=" + key;
		}
	    switch (videoFormat.toUpperCase()) {
			case "HD":
				var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key+"&fmt=22"
				fastYoutubeDownloader.downloadVideo(doc.videoTitle, downloadURL, "mp4", videoId);
				return;
				break;
			case "FULL_HD":
				var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key+"&fmt=37"
				fastYoutubeDownloader.downloadVideo(doc.videoTitle, downloadURL, "mp4", videoId);
				return;
				break;
			case "MP4":
				var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key+"&fmt=18"

				break;
			case "3GP":
				var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key+"&fmt=17"
				break;
			default:
				var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key
	    }
		fastYoutubeDownloader.downloadVideo(doc.videoTitle, downloadURL, videoFormat, videoId);
}


fastYoutubeDownloader.createDownloadLink = function(doc, videoFormat)
{
	var downloadLink = doc.createElement("a");
	downloadLink.setAttribute("href", "#")
	downloadLink.setAttribute("onclick", "return false");
	downloadLink.style.marginLeft = "3px"
	downloadLink.style.fontSize = "11px";
	downloadLink.doc = doc
	downloadLink.videoFormat = videoFormat;
	downloadLink.innerHTML   = videoFormat;
	downloadLink.addEventListener("click",function(e)
	{

		var videoId     = e.currentTarget.doc.videoId;
		var doc			= e.currentTarget.doc;
		var videoFormat = e.currentTarget.videoFormat;

		var innerHTML = doc.getElementsByTagName("html")[0].innerHTML;
		var key = innerHTML.match(/\&t=[\w-]{10,}/ig)
		var youtubeFlashPlayer = doc.getElementById('movie_player');

		var found = false;
		if (youtubeFlashPlayer)
		{
			var flashvars = youtubeFlashPlayer.attributes.getNamedItem('flashvars');
			if (flashvars!=null)
			{
				var key = flashvars.value.match(/\&t=[\w-]{10,}/ig)
				if (key.length>0) key = key[0]
				key += "=";
				found = true;
			} else {
				//return;
			}
		}
		if (!found) {
			if (doc==null) {
				var a = innerHTML.indexOf("\"t\":")+6;
			} else {
				if (doc.u==true) {
					var a = innerHTML.indexOf("\"token\":")+10;
				} else {
					var a = innerHTML.indexOf("\"t\":")+6;
				}
			}

			var b = innerHTML.indexOf("\"", a);
			var key  = innerHTML.substring(a, b);
			key = "t=" + key;
		}
	    switch (videoFormat.toUpperCase()) {
			case "HD":
				var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key+"&fmt=22"
				fastYoutubeDownloader.downloadVideo(doc.videoTitle, downloadURL, "mp4", videoId);
				return;
				break;
			case "MP4":
				var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key+"&fmt=18"
				break;
			case "3GP":
				var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key+"&fmt=17"
				break;
			default:
				var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key
	    }
		fastYoutubeDownloader.downloadVideo(doc.videoTitle, downloadURL, videoFormat, videoId);


	},false);
	return downloadLink;
}

fastYoutubeDownloader.getYoutubePage = function(videoId, videoFormat)
{

	var url = "http://www.youtube.com/watch?v=" + videoId;
	var xmlHttpRequest;
	if (window.XMLHttpRequest) {
		xmlHttpRequest = new XMLHttpRequest();
	} else if (window.ActiveXObject) {
		xmlHttpRequest = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlHttpRequest.open("GET", url, true);
	xmlHttpRequest.onreadystatechange =  function () {
		if (xmlHttpRequest.readyState == 4) {
			if (xmlHttpRequest.status == 200) {
			var posA = xmlHttpRequest.responseText.indexOf("\"t\":") + 6;
			var posB = xmlHttpRequest.responseText.indexOf("\"", posA);
			var key  = xmlHttpRequest.responseText.substring(posA, posB);

			var title = "Video";
			posA = xmlHttpRequest.responseText.indexOf("<title>")
			posB = xmlHttpRequest.responseText.indexOf("</title>")
			if ((posA!=-1) && (posB!=-1))
			{
				title = xmlHttpRequest.responseText.substr(posA + String("<title>").length, posB - posA - String("</title>").length + 1)
				title = title.replace(/youtube - /gi, "")
			}
			key = "t=" + key;

			switch (videoFormat.toUpperCase()) {
				case "HD":
					var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key+"&fmt=22"
					fastYoutubeDownloader.downloadVideo(title, downloadURL, "mp4", videoId);
					return;
					break;
				case "MP4":
					var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key+"&fmt=18"
					break;
				case "3GP":
					var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key+"&fmt=17"
					break;
				default:
					var downloadURL = "http://youtube.com/get_video?video_id="+videoId+"&"+key
			}

			fastYoutubeDownloader.downloadVideo(title, downloadURL, videoFormat, videoId);
			}
		}
	};
	xmlHttpRequest.send("");
}
fastYoutubeDownloader.downloadVideo = function(videoTitle,downloadURL,format, videoId)
{
	if (format.toLowerCase()=="hd") videoTitle += "_hd";
	var destinationFile    = fastYoutubeDownloader.openFilePicker(videoTitle+"."+format, format);
	if (destinationFile!=null) {
		if (!fastYoutubeDownloader.p.useFirefoxDownloadManager) {
			  videoDownloadItem = {
				  title		   : videoTitle,
				  downloadURL  : downloadURL,
				  videoId      : videoId,
				  thumbnailURL : "http://i2.ytimg.com/vi/" + videoId + "/default.jpg",
				  path         : destinationFile.path,
				  folder       : destinationFile.folder
			  };
			  fastYoutubeDownloader.addVideoDownloadItem(videoDownloadItem);
			  return;
		}

		var persist = Components.classes['@mozilla.org/embedding/browser/nsWebBrowserPersist;1']
					 .createInstance(Components.interfaces.nsIWebBrowserPersist);
		var xfer    = Components.classes["@mozilla.org/transfer;1"]
					.createInstance(Components.interfaces.nsITransfer);
		var ios     = Components.classes['@mozilla.org/network/io-service;1']
					 .getService(Components.interfaces.nsIIOService);
		var uri     = ios.newURI(downloadURL, null, null);
		var target  = ios.newFileURI(destinationFile.file);
		xfer.init(uri, target, "", null, null, null, persist);
		persist.progressListener = xfer;
		persist.saveURI(uri, null, null, null, null, destinationFile.file);
	}
}

fastYoutubeDownloader.openFilePicker = function(fileName,format)
{
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "Save As", nsIFilePicker.modeSave);
	fp.appendFilter(format, "*."+ format);
	fp.defaultString = fileName;
	var rv = fp.show();
	var _folder = null;
	if (fp) {
		if (fp.displayDirectory) {
			_folder = fp.displayDirectory.path;
		}
	}
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace)
	{
	//  return fp.file;
	  return {
		  file    : fp.file,
		  path    : fp.file.path,
		  folder  : _folder
	  }
	}
	return;
}

fastYoutubeDownloader.initialize();
