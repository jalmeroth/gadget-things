var prefs = new gadgets.Prefs();

function adjustHeight(){
	
	var size = document.getElementById('wrapper').clientHeight;
	
	size += 15;
	
	if(size < 40) { // minimum size
		size = 40;
	}
	
	// console.log("size: " + size);
	
	gadgets.window.adjustHeight(size);
	
	return;
}

function toggle(dict){
	
	var areas = ['settings', 'logout', 'statusMsg', 'newTaskSet' ,'buttons'];
	
	for (var i in areas) {
		
		var id = areas[i];
		
		var element = document.getElementById(id);
		var state = dict[id] || false;
		
		// logging(id + ":"+ state);
		
		if(state) {
			element.style.display = 'block';
		} else {
			element.style.display = 'none';
		}
	}
	
	adjustHeight();
	
	return;
}

function setValue(id, val) {
	var element = document.getElementById(id);
	element.value = val;
	return;
}

function newToDo() {
	var accountId = prefs.getString("accountId");
	
	if(accountId != '') {
		toggle({'newTaskSet': true});
		setValue('title', title());
	} else {
		settings();
	}
	
	return;
}

function cancel() {
	return initialize();
}

function save(obj) {
	
	var items = [];
	var fields = {'title':'title', 'notes':'note', 'duedate':'duedate', 'where':'where'};
	
	if(!obj) {
		
		var item = {};
		
		for (var field in fields) {
			
			var key = fields[field];
			
			var element = document.getElementById(field);
			
			var val = element.value;
			
			if (val) {
				item[key] = val;
			}
		}
		
		items.push(item);
		// logging(gadgets.json.stringify(items));
		
		var accountId = prefs.getString("accountId");
		var url = "https://gadget-things.appspot.com/";

		var postdata = {};
		
		postdata['accountId'] = accountId;
		postdata['items'] = items;
		
		data = gadgets.json.stringify(postdata);
		
		var headers = {};
		
		makePOSTRequest(url, data, headers, save, true);
	
	} else {
		
		var data = parseResponse(obj);
		var index = data.hasOwnProperty('current-item-index');
		
		if (index) {
			toggle({
				'statusMsg': true,
				'buttons': true
			});
		} else {
			logging(data);
		}
	}
	
	return;
}

function setAccount(accountId) {
	logging('Setting account: '+ accountId);
	return prefs.set("accountId", accountId);
}

function logging(message) {
	return console.log(message);
}

function nocache(url) {
	var ts = new Date().getTime();
	var sep = "?";
	
	if (url.indexOf("?") > -1) {
		sep = "&";
	}
	
	url = [ url, sep, "nocache=", ts ].join("");
	// logging(url);
	
	return url;
}

function makeGETRequest(url, headers, callback, nocaching) {
	var params = {};

	if(!callback) {
		var callback = parseResponse;
	}
	
	if (nocaching) {
		url = nocache(url);
	}
	
	params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON;
	params[gadgets.io.RequestParameters.HEADERS] = headers;
	gadgets.io.makeRequest(url, callback, params);
	
	return;
}

function makePOSTRequest(url, postdata, headers, callback, nocaching) {
	var params = {};
	
	if(!callback) {
		var callback = parseResponse;
	}
	
	if (nocaching) {
		url = nocache(url);
	}
	
	params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST;
	params[gadgets.io.RequestParameters.HEADERS] = headers;
	params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON;
	params[gadgets.io.RequestParameters.POST_DATA]= postdata;
	
	// logging(params);

	gadgets.io.makeRequest(url, callback, params);
	
	return;
}

function parseResponse(obj) {
	var data = gadgets.json.parse(obj.text);
	// logging(data);
	return data;
}

function title() {
	matches = google.contentmatch.getContentMatches();
	return matches[0]['subject'];
}

function settings() {
	var accountId = prefs.getString("accountId");
	
	if(accountId != "") {
		toggle({
			'settings': true,
			'logout': true
		});
	} else {
		toggle({'settings': true});
	}
	
	return;
}

function login(obj) {
	
	var mail = document.getElementById('user_mail');
	var pass = document.getElementById('user_pass');

	if(!obj) {
		
		var user_mail = mail.value;
		var user_pass = pass.value;
		
		if (user_mail && user_pass) { // trying to login
		
			logging(user_mail + "/" + user_pass);
		
			var headers = {
				"Content-Type" : "application/json",
				"Authorization" : ("Password " + user_pass)
			};
		
			var url = "https://thingscloud.appspot.com/version/1/account/" + user_mail + "/own-history-keys";
		
			makeGETRequest(url, headers, login, true);
		
		} else { // trying to logout
			setAccount('');
			initialize();
		}
	
	} else {
		var data = parseResponse(obj);
		
		if(data) { // login successful
			setAccount(data[0]);
			mail.value = '';
			pass.value = '';
			initialize();
		}
	}
	
	return;
}

function initialize() {
	toggle({'buttons': true});
	return;
}

window.onload = function () {
	initialize();
};