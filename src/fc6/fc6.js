// this is a port from fc4 based calendar.js to fc6 using fullcalendar.io/icalendar, build with npm,
// see https://github.com/fullcalendar/fullcalendar-examples/tree/main/webpack

import $ from "jquery";

import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid'
import iCalendarPlugin from '@fullcalendar/icalendar'
// import './daygrid.css';  // no longer used

var loc = window.location;  // the current page
var calendarEl = document.getElementById('calendar');
var verbose = true;

function makeUL(array, colors) {
  // Create the list element:
  var list = document.createElement('ul');
  // assign css class
  list.classList.add('cal_legend');
  for (var i = 0; i < (array.length - 1); i++) {
    // Create the list item:
    var item = document.createElement('li');
    
    // Set its contents:
    item.appendChild(document.createTextNode(array[i]));
    item.style.color = colors[i];
    
    // Add it to the list:
    list.appendChild(item);
  }
  // Finally, return the constructed list:
  console.log(list);
  return list;
}

function Settings() {	// edit / change these as needed !
  var settings = [];
  var verbose = false;
  settings["verbose"] = verbose;
  var defaultLocale = "en";
  settings["locale"] = defaultLocale;
  var locale = $('#locale').text();	//	get Paramter from DOM
  if (locale.length > 0)
    settings["locale"] = 'de';
  settings["pagecalendars"] = [];
  var pageFilestring = $('#pagecalendars').text();	//	get Paramter from DOM
  var calendars = pageFilestring.split(",");
  if (verbose)	console.log('calendars:', calendars);
  if (pageFilestring.length > 0)
    settings["pagecalendars"] = calendars;
  settings["weekNums"] = true;
  settings["showlegend"] = true;
  var defaultcolors = ["LightSalmon","IndianRed","LightSkyBlue","Red","Blue","Green","Black","Grey"];
  settings["colors"] = defaultcolors;
  var colorString = $('#colors').text();	//	get Paramter from DOM
  var colors = colorString.split(",");
  if (verbose)	console.log("colors: ", colors);
  if (colorString.length > 0)
    settings["colors"] = colors;
  /* obsolete Options from fc4 Version:
  settings["enableDescPopup"] = false;
  settings["tzoffset_single"] = 0;
  settings["tzoffset_minutes"] = 0;
  settings["tzoffset_recur"] = 0;
  settings["useIcsTimezone"] = 0;
  */
  return settings;
}

var settings = Settings();
var verbose = false;
if (settings["verbose"] != null)
  verbose = settings["verbose"];
var defaultLocale = "en";
var now = "en";
var LocaleCode = defaultLocale;
if (settings["locale"].length > 0)
  LocaleCode = settings["locale"];
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
var weekNums = false;
if (settings["weekNums"] == true)
  weekNums = true;  //  settings["weekNums"];
if (verbose)  console.log("WeekNums:", weekNums);

const pageCalendars = settings["pagecalendars"];  //  ["Schulferien_BW.ics", "Feiertage_DE.ics", "hoernerfranzracing.ics"];
const colors = settings["colors"];	//	["LightSalmon","IndianRed","LightSkyBlue","Red"];
if (verbose) console.log(colors);
var showlegend = settings["showlegend"];
if (verbose) console.log(pageCalendars);
var evsrc = [];
var calNames = [];
var i = 0;
pageCalendars.forEach(function(value, index) {
  var calurl = loc + '/' + value;
  const element = { url: calurl, format: "ics", color: colors[i]};
  evsrc.push(element);
  calNames.push(value);
  i++;
})
if (verbose)  console.log(evsrc);

// so gehts !! - see https://stackoverflow.com/questions/70585910/can-fullcalendar-use-multiple-ics-urls
var calendar = new Calendar(calendarEl, {
  plugins: [dayGridPlugin, iCalendarPlugin],
  locale: LocaleCode,
  headerToolbar: {  // replaces header{} from fc4
    center: 'title',
    start: 'prevYear,nextYear',
    end: 'today prev,next' // will normally be on the right. if RTL, will be on the left
  },
  buttonText: {  // neu 30.07.23, Today Button Language
    today: now
  },
  navLinks: false, // can click day/week names to navigate views
  editable: false,
  fixedWeekCount: false,
  firstDay: 0,	// new 20.03.23 - DONE: make this configurable !
  weekNumbers: weekNums,
  eventSources: evsrc,
});

calendar.render();

if (showlegend) {
  // Add the contents of cfgfiles to #legend:
  document.getElementById('legend').appendChild(makeUL(calNames, colors));
}