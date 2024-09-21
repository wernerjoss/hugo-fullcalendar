// this is a hugo port from grav-plugin-fullcalendar/calendar.js
// currently with hardcoded Parameters
// TODO:
// remove unused cors cruft :-)
// get Parameters via shortcode

// Load jQuery when it is not loaded already by the theme
if (typeof jQuery=='undefined') {
	var headTag = document.getElementsByTagName("head")[0];
	var jqTag = document.createElement('script');
	jqTag.type = 'text/javascript';
	jqTag.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js';
	jqTag.onload = whenJqReady;
	headTag.appendChild(jqTag);
} else {
	whenJqReady();
}

// define Parameters, hardcoded, see TODO above
	
function Settings() {	// edit / change these as needed !
	var settings = [];
	settings["locale"] = 'de';
	settings["pagecalendars"] = ["events.ics","holidays.ics"];
	settings["weekNums"] = true;
	settings["showlegend"] = true;
	var colors = ["LightSalmon","IndianRed","LightSkyBlue","Red"];
	settings["colors"] = colors;
	settings["enableDescPopup"] = false;
	settings["tzoffset_single"] = 0;
	settings["tzoffset_minutes"] = 0;
	settings["tzoffset_recur"] = 0;
	settings["useIcsTimezone"] = 0;
	return settings;
}

function whenJqReady() {
	var verbose = false;
	settings = Settings();
	if (settings["locale"].length > 0)
		LocaleCode = settings["locale"];
	else
		LocaleCode = defaultLocale;
		
	var weekNums = settings["weekNums"];
	var firstWeekDay = 0;	// Default, new 20.03.23
	var pagecalendars = settings["pagecalendars"];
	colors = settings["colors"];	//	["LightSalmon","IndianRed","LightSkyBlue","Red"];
	if (verbose) console.log('colors[]:', colors);
	var showlegend = settings["showlegend"];
	var defaultEnableDescPopup = false;
	var cfg_enableDescPopup = settings["enableDescPopup"];
	var enableDescPopup = (cfg_enableDescPopup !== null) ? cfg_enableDescPopup : defaultEnableDescPopup;

	if (verbose)	{
		console.log("Locale:", LocaleCode);
		console.log('showlegend:', showlegend);
		console.log("1st Weekday: ", firstWeekDay);
		console.log('LocaleCode:', LocaleCode);
		console.log('pagecalendars:', pagecalendars);
	}

	var calUrls = [];
	var calNames = [];
	var loc = window.location;  // the current page
	pagecalendars.forEach(function(value, index) {
		if (value) {
			url = loc + '/' + value;
			calUrls.push(url);
			calNames.push(value);
		}
	})
	
	if (verbose) console.log('calUrls:', calUrls);
	var len = calUrls.length;
	if (verbose)	console.log('num calUrls:', len);

	var cfg_tz_offset_single = settings["tzoffset_single"];	//	Offset for single Events
	var default_tz_offset_single = 0;	// Default
	var tz_offset_single = 0; // Default
	tz_offset_single = (cfg_tz_offset_single !== null) ? cfg_tz_offset_single : default_tz_offset_single;

	var cfg_tz_offset_minutes = settings["tzoffset_minutes"];	//	minutes Offset for single Events
	var default_tz_offset_minutes = 0;	// Default
	var tz_offset_minutes = 0;	// Default
	tz_offset_minutes = (cfg_tz_offset_minutes !== null) ? cfg_tz_offset_minutes : default_tz_offset_minutes;

	var cfg_tz_offset_rec = settings["tzoffset_recur"];	//	Offset for single Events
	var default_tz_offset_rec = 0;	// Default
	var tz_offset_rec = 0;	// Default
	tz_offset_rec = (cfg_tz_offset_rec !== null) ? cfg_tz_offset_rec : default_tz_offset_rec;

	var useIcsTimezone = settings["useIcsTimezone"];	//	get Paramter from DOM'
	useIcsTimezone = (useIcsTimezone > 0) ? useIcsTimezone : false;
	
	// End Parameters
	
	var icsTimezone = 'Europe/Berlin';	// Default
	var dlstart = 0;
	var dlend = 0;
	// determine Time Zone from 1st Calendar in List - others will be ignored because time zone is a single setting for the whole calendar Object !
	if (len > 0) {
		calendarUrl = calUrls[0];
		//	console.log(calendarUrl);
		jQuery.ajax({
			crossOrigin: true,
			// proxy: cors_api_url,	// no more proxy :-)
			url: calendarUrl,
			async: false,	// important !
			context: {},
			success: function(data) {
			}
		})
		.done(function( data, textStatus, jqXHR ) {
			//	console.log(data);
			var jcalData = ICAL.parse(data);	//	directly parse data, no need to split to lines first ! 14.02.20
			var comp = new ICAL.Component(jcalData);

			var tzComps = comp.getAllSubcomponents("vtimezone");
			tzids = jQuery.map(tzComps, function(item) {
				var entry = item.getFirstPropertyValue("tzid");
				if (entry !== null)	icsTimezone = entry;
				// now evaluate Daylight saving time period (months):
				var dlComps = item.getAllSubcomponents("daylight");
					dlids = jQuery.map(dlComps, function(item) {
					var entry = item.getFirstPropertyValue("rrule");
					if (entry !== null)	{
						var parts = entry["parts"];
						//	console.log(parts);
						var bymo = parts["BYMONTH"];	// uppercase !!
						//	console.log(bymo);
						dlstart = parseInt(bymo[0]);
					}
				});
				dlComps = item.getAllSubcomponents("standard");
					dlids = jQuery.map(dlComps, function(item) {
					var entry = item.getFirstPropertyValue("rrule");
					if (entry !== null)	{
						var parts = entry["parts"];
						//	console.log(parts);
						var bymo = parts["BYMONTH"];	// uppercase !!
						//	console.log(bymo);
						dlend = parseInt(bymo[0]);
					}
				});
			});
			if (dlstart > dlend) {	// swap dlstart, dlend if necessary
				temp = dlstart;
				dlstart = dlend;
				dlend = temp;
			}
			//	console.log("daylight start:", dlstart);	console.log("daylight end:", dlend);
		},'text');
	}
	if (verbose)	console.log('icsTimezone: ', icsTimezone);
	var calTimezone = 'local';	// Default
	if (useIcsTimezone)	calTimezone = icsTimezone;
	if (verbose)	console.log('calTimezone: ', calTimezone);

	// page is now ready, initialize the calendar...
	var calendarEl = document.getElementById('calendar');
	switch (LocaleCode) {
		case 'de':
			now = "Heute";
			break;
		case 'es':
			now = "Hoy";
			break
		case 'fr':
			now = "Aujourd'hui";
			break
		case 'it':
			now = "Oggi";
			break
		case 'nl':
			now = "Vandaag";
			break
		default:
			now = "today";
	}
	var calendar = new FullCalendar.Calendar(calendarEl, {
		plugins: [ 'interaction', 'dayGrid', 'rrule', 'moment', 'momentTimezone' ],	// docs on plugin names are wrong !!
		timeZone: calTimezone,	//	setting from config, default is 'local'
		locale: LocaleCode,
		weekNumbers: weekNums,
		header: {
			left: 'prevYear,nextYear',
			center: 'title',
		},
		buttonText: {  // neu 30.07.23, Today Button Language
			today: now
		},
		navLinks: false, // can click day/week names to navigate views
		editable: false,
		eventLimit: false, // allow "more" link when too many events
		fixedWeekCount: false,
		firstDay: firstWeekDay,	// new 20.03.23 - DONE: make this configurable !
		eventClick: function(info) {
			info.jsEvent.preventDefault(); // don't let the browser navigate
			//	console.log(info.event.extendedProps["description"]);
			if (info.event.url) {
				window.open(info.event.url);	// open url in new Window/Tab
			}
			if (enableDescPopup)	{	// show alert popup with description, if enabled
				if (info.event.extendedProps["description"]) {
					alert(info.event.extendedProps["description"]);
				}
			}
		},
		//	Description as Tooltip (tippy.js) :
		eventRender: function(info) {
			if (!enableDescPopup) {	// tippy hover only if click popup is disabled
				if (info.event.extendedProps.description) {
					tippy (info.el, {
						content: info.event.extendedProps.description,
						allowHTML: true,	// see https://github.com/wernerjoss/grav-plugin-fullcalendar/issues/29
					});
				}
			}
		},
		events: function(info, successCallback, failureCallback) {
			var allevents = [];
			calUrls.forEach(function(value, index) {
				calendarUrl = value;
				if (verbose) console.log('Calendar URL:' + calendarUrl);
				var events = [];
				var do_callback = false; // muss zwingend hier hin, nicht ausserhalb der forEach schleife !!
				if (index == (len - 1)) {
					do_callback = true;
				}
				if (verbose) console.log('index,do_callback:', index, do_callback);
				jQuery.ajax({
					crossOrigin: true,
					// proxy: cors_api_url,	//	"http://localhost:8080/proxy.php", //to overide default proxy
					url: calendarUrl,
					//dataType: "json", //no need. if you use crossOrigin, the dataType will be override with "json"
					//charset: 'ISO-8859-1', //use it to define the charset of the target url
					//contentType: "application/json; charset=ISO-8859-1",	// test encoding, geht nicht 31.08.22
					context: {},
					success: function(data) {
						//	alert(data);
						//	$( '#test' ).html(data);
					}
				})
				.done(function( data, textStatus, jqXHR ) {
					if (verbose)	console.log(data);
					var jcalData = ICAL.parse(data);	//	directly parse data, no need to split to lines first ! 14.02.20
					var comp = new ICAL.Component(jcalData);

					var comp = new ICAL.Component(jcalData);
					var eventComps = comp.getAllSubcomponents("vevent");
					//	map them to FullCalendar events Objects
					events = jQuery.map(eventComps, function(item) {
						var fcevents = {};
						//	fcevents["tzid"] = icsTimezone;
						var entry = item.getFirstPropertyValue("summary");
						//	console.log('Entry: ', entry);
						//	fix badly encoded Text from remote google calendars 01.09.22
						try	{	// see https://stackoverflow.com/questions/5396560/how-do-i-convert-special-utf-8-chars-to-their-iso-8859-1-equivalent-using-javasc
							entry = decodeURIComponent(escape(entry));
						}	catch(e)	{
							entry = entry;
						}
						if (entry !== null)	fcevents["title"] = entry;
						var entry = item.getFirstPropertyValue("location");
						if (entry !== null)	fcevents["location"] = entry;
						var entry = item.getFirstPropertyValue("url");
						if (entry !== null)	fcevents["url"] = entry;
						var entry = item.getFirstPropertyValue("dtstart");
						if (entry !== null)	{ fcevents["start"] = entry.toJSDate(); var start = entry;}

						//	tz_offset_single = 0;	//		now from plugin config 01.01.22
						if (verbose) console.log('tz_offset_single:', tz_offset_single);
						if ((tz_offset_single != 0)  && (start != null)) {	// wichtig: Abfrage auf null, NICHT 0 ! 21.09,24
							start["hour"] = (start["hour"] + Number(tz_offset_single)) % 24;	// add hours from config, type conversion mandatory ! :)
							fcevents["start"] = start.toJSDate();
							if (verbose) console.log('newstart', start);
						}
						//	tz_offset_minutes = 15;	//
						if (verbose) console.log('tz_offset_minutes:', tz_offset_minutes);
						if ((tz_offset_minutes != 0) && (start != null)) {
							start["minute"] = (start["minute"] + Number(tz_offset_minutes));	// add minutes from config, do NOT use modulo 60 !
							fcevents["start"] = start.toJSDate();
							if (verbose) console.log('newstart', start);
						}

						var entry = item.getFirstPropertyValue("dtend");
						if (entry !== null)	{ fcevents["end"] = entry.toJSDate(); var end = entry; }
						duration = fcevents["end"] - fcevents["start"];	// calculate event duration 29.08.20
						if (verbose)	console.log('Duration:', duration);
						fcevents["allDay"] = true;	// default value -> span .fc-time in grid is NOT created
						if (duration < 86400000)	fcevents["allDay"] = false;	// duration less than 1 day: allDay = false
						var entry = item.getFirstPropertyValue("description");	// add description 22.06.20
						try	{	// see https://stackoverflow.com/questions/5396560/how-do-i-convert-special-utf-8-chars-to-their-iso-8859-1-equivalent-using-javasc
							entry = decodeURIComponent(escape(entry));
						}	catch(e)	{
							entry = entry;
						}
						if (entry !== null)	fcevents["description"] = entry;
						var entry = item.getFirstPropertyValue("color");	// add color from ics
						if (entry !== null)	fcevents["color"] = entry;

						// not used options go here

						var rrules = item.getFirstPropertyValue("rrule");
						var fcrrules = {};	// extra object for rrules
						if (rrules !== null)	{
							if (rrules.freq !== null)	{	//	freq is required, do not continue if null
								if (verbose)	console.log('rrules:', rrules);
								fcrrules["freq"] = rrules.freq;
								if (verbose) console.log('start', start["_time"]);
								if (verbose) console.log('start day', start["day"]);
								// Korrektur f. 1 Tag Versatz nach vorne 06.03.22 - crazy - see https://github.com/wernerjoss/grav-plugin-fullcalendar/issues/44#issuecomment-1057087028
								if (fcevents["allDay"]) {
									start["day"] = start["day"] + 1;
									end["day"] = end["day"] + 1;
									if (verbose) console.log('start day', start["day"], 'end day', end["day"]);
								}
								if (verbose) console.log('tz_offset_rec:', tz_offset_rec);	//	now from plugin config 01.01.22
								var tz_offset_dl = parseInt(tz_offset_rec);	// default
								M = parseInt(start["month"]);
								//	console.log('Month:', M);	//	start["month"]);
								if ((M > dlstart) && (M <= dlend)) {
									tz_offset_dl = tz_offset_dl + 1;	// add 1h during DAYLIGHT saving period
								}	// DONE: get DAYLIGHT Start/Endmonth from ICS
								//	console.log(tz_offset_dl);
								if (tz_offset_dl != 0) {
									start["hour"] = (start["hour"] + Number(tz_offset_dl)) % 24;	// add hours from config, type conversion mandatory ! :)
									//	fcevents["start"] = start.toJSDate();
									if (verbose) console.log('newstart', start);
								}
								fcevents["start"] = start.toJSDate();	// move here 06.03.22 !
								/* not needed
								end["hour"] = end["hour"] + tz_offset;
								if (verbose)	console.log('newend', end);
								fcevents["end"] = end.toJSDate();
								*/
								var parts = rrules["parts"];
								if (verbose)	console.log('parts:', parts);
								var byweekday = parts["BYDAY"];
								var weekdays = [];	// must be empty array, otherwise, push() will not work !
								var bysetpos = [];
								if (Array.isArray(byweekday))	{
									byweekday = parts["BYDAY"];
									for (i = 0; i < byweekday.length; i++) {
										//	DONE: implement BYDAY n+ or n-
										if (byweekday[i].match(/\d+/g))	{	// entry contains digits, save them to setpos, strip from weekdays
											var daynum = parseInt(byweekday[i]).toString();
											//	console.log('daynum: ' + daynum) ;
											bysetpos.push(daynum);
											weekdays.push(byweekday[i].replace(/[0-9,+,-]/g, ''));
										} else { weekdays.push(byweekday[i]); }	// no digits, just save to weekdays
									}
									byweekday = weekdays;
								}	else	{byweekday = null;}
								if (verbose)	console.log('byweekday:', byweekday);
								var byweekno = parts["BYWEEKNO"];
								if (Array.isArray(byweekno))	{byweekno = parts["BYWEEKNO"];}	else	{byweekno = null;}
								if (verbose)	console.log('byweekno:', byweekno);
								var bymonth = parts["BYMONTH"];
								if (Array.isArray(bymonth))	{bymonth = parts["BYMONTH"];}	else	{bymonth = null;}
								if (verbose)	console.log('bymonth:', bymonth);
								var bymonthday = parts["BYMONTHDAY"];
								if (Array.isArray(bymonthday))	{bymonthday = parts["BYMONTHDAY"];}	else	{bymonthday = null;}
								if (verbose)	console.log('bymonthday:', bymonthday);
								var byyearday = parts["BYYEARDAY"];
								if (Array.isArray(byyearday))	{byyearday = parts["BYYEARDAY"];}	else	{byyearday = null;}
								if (verbose)	console.log('byyearday:', byyearday);
								if (rrules.dtstart !== undefined)	{fcrrules["dtstart"] = rrules.dtstart;}	else	{fcrrules["dtstart"] = fcevents["start"];}
								if (byweekday !== null) { fcrrules["byweekday"] = byweekday;}
								if (bysetpos !== null) { fcrrules["bysetpos"] = bysetpos;}
								if (byweekno !== null) { fcrrules["byweekno"] = byweekno;}
								if (bymonth !== null) { fcrrules["bymonth"] = bymonth;}
								if (bymonthday !== null) { fcrrules["bymonthday"] = bymonthday;}
								if (byyearday !== null) { fcrrules["byyearday"] = byyearday;}
								if (rrules.interval != null) { fcrrules["interval"] = rrules.interval;}
								if (rrules.count != null) { fcrrules["count"] = rrules.count;}
								if (rrules.wkst != null) { fcrrules["wkst"] = rrules.wkst;}
								if (rrules.until != null) { fcrrules["until"] = rrules.until.toJSDate();}

								fcevents["rrule"] = fcrrules;
								if (verbose) console.log('fcrrules:', fcrrules);
							}
						}
						if(fcevents["color"] == null) { fcevents["backgroundColor"] = colors[index];}
						if (verbose)	console.log('fcevents:', fcevents);
						if (item.getFirstPropertyValue("class") === "PRIVATE") {
							return null;
						} else {
							return fcevents;
						}
					})
					jQuery.merge(allevents, events);
					if (verbose) console.log('index,do_callback:', index, do_callback);
					if (verbose) console.log('events:', events);
					if (do_callback) {
						successCallback(allevents);	// wichtig !!
						if (verbose)	console.log('allevents:', allevents);
					}
				},
				'text');
			})
		}
	});
	//	console.log(calendar);
	calendar.render();
	// show legend, if enabled
	if (showlegend) {
		// Add the contents of cfgfiles to #legend:
		document.getElementById('legend').appendChild(makeUL(calNames, colors));
	}
}

function makeUL(array, colors) {
	// Create the list element:
	var list = document.createElement('ul');
	// assign css class
	list.classList.add('cal_legend');
	for (var i = 0; i < array.length; i++) {
		// Create the list item:
		var item = document.createElement('li');

		// Set its contents:
		item.appendChild(document.createTextNode(array[i]));
		item.style.color = colors[i];

		// Add it to the list:
		list.appendChild(item);
	}
	// Finally, return the constructed list:
	return list;
}

function getAbsolutePath() { // see https://www.sitepoint.com/jquery-current-page-url/
	var loc = window.location;
	//  console.log('window.location:', loc);
	var pathName = loc.pathname.substring(0, loc.pathname.lastIndexOf('/') + 1);
	return loc.href.substring(0, loc.href.length - ((loc.pathname + loc.search + loc.hash).length - pathName.length));
}
