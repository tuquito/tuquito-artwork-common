$(document).ready(function() {
	function hotkeys() {
		$(document).bind('keyup', 't', function() {
			location.href="http://www.tuquito.org.ar"
			return false;
		});
		$(document).bind('keydown', 'g', function() {
			$("#google").click();
			return false;
		});
		$(document).bind('keydown', 'f', function() {
			location.href="http://www.facebook.com"
			return false;
		});
		$(document).bind('keydown', 'w', function() {
			location.href="http://www.twitter.com"
			return false;
		});
	};

	hotkeys();

	$("#google").fancybox({
		'titleShow'	: false,
		'onClosed'	: function() { hotkeys(); }
	});

	$("#google").click(function() {
		$("#sf").focus().val('');
		$(document).unbind('keydown', 'g');
		$(document).unbind('keydown', 't');
		$(document).unbind('keydown', 'f');
		$(document).unbind('keydown', 'w');
	});

	// create custom animation algorithm for jQuery called "bouncy"
	$.easing.bouncy = function (x, t, b, c, d) {
		var s = 1.70158;
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	}
	// create custom tooltip effect for jQuery Tooltip
	$.tools.tooltip.addEffect("bouncy",
		function(done) {
			this.getTip().animate({top: '+=15'}, 500, 'bouncy', done).show();
		},
		function(done) {
			this.getTip().animate({top: '-=15'}, 500, 'bouncy', function()  {
				$(this).fadeOut();
				done.call();
			});
		}
	);

	$("a[title]").tooltip({
		offset: [-25, 0],
		effect: 'bouncy'
	});

	$("a").hover(
	function() {
		$(this).animate({opacity: 1}, 500);
	},
	function() {
		$(this).animate({opacity: 0.3}, 500);
	});
});
