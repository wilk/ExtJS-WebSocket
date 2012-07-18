# ExtJS-WebSocket

ExtJS-WebSocket is an extension to handle and use the HTML5 WebSocket with ExtJS.
It has two classes: **Ext.ux.WebSocket** and **Ext.ux.WebSocketManager**
The first one is a wrapper for standard HTML5 WebSocket and it provides a lot of interesting and easy-to-use features.
The second one is a singleton to register different Ext.ux.WebSocket and it provides functions to work with every registered websocket in the same time.

## Usage
Load Ext.ux.WebSocket and Ext.ux.WebSocketManager via Ext.require:

```javascript
Ext.Loader.setConfig ({
	enabled: true
});

Ext.require (['Ext.ux.WebSocket', 'Ext.ux.WebSocketManager']);
```

Now, you are ready to use them in your code as follows:

```javascript
// Creating a new instance of Ext.ux.WebSocket
var ws = Ext.create ('Ext.ux.WebSocket', {
	url: 'your_url:your_port' ,
	protocol: 'your_protocol'
});

// Using Ext.ux.WebSocketManager
Ext.ux.WebSocketManager.register (ws);
```

## Communications supported
### Pure text communication
The communication is text-only, without objects or any other kind of data.

```javascript
var websocket = Ext.create ('Ext.ux.WebSocket', {
	url: 'http://localhost:8888' ,
	listeners: {
		open: function (ws) {
			console.log ('The websocket is ready to use');
			ws.send ('This is a simple text');
		} ,
		close: function (ws) {
			console.log ('The websocket is closed!');
		} ,
		error: function (ws, error) {
			Ext.Error.raise (error);
		} ,
		message: function (ws, message) {
			console.log ('A new message is arrived: ' + message);
		}
	}
});
```

### Pure event-driven communication
The communication is event-driven: an event and a String or Object are sent and the websocket handles different events.

```javascript
var websocket = Ext.create ('Ext.ux.WebSocket', {
	url: 'http://localhost:8888' ,
	listeners: {
		open: function (ws) {
			console.log ('The websocket is ready to use');
			ws.send ('init', 'This is a simple text');
			ws.send ('and continue', {
				'my': 'data' ,
				'your': 'data'
			});
		} ,
		close: function (ws) {
			console.log ('The websocket is closed!');
		}
	}
});

// A 'stop' event is sent from the server
// 'data' has 'cmd' and 'msg' fields
websocket.on ('stop', function (data) {
	console.log ('Command: ' + data.cmd);
	console.log ('Message: ' + data.msg);
});
```

### Mixed communication
The communication is mixed: it can handles text-only and event-driven communication.

```javascript
var websocket = Ext.create ('Ext.ux.WebSocket', {
	url: 'http://localhost:8888' ,
	listeners: {
		open: function (ws) {
			console.log ('The websocket is ready to use');
			ws.send ('This is only-text message');
			ws.send ('init', 'This is a simple text');
			ws.send ('and continue', {
				'my': 'data' ,
				'your': 'data'
			});
		} ,
		close: function (ws) {
			console.log ('The websocket is closed!');
		} ,
		message: function (ws, message) {
			console.log ('Text-only message arrived is: ' + message);
		}
	}
});

// A 'stop' event is sent from the server
// 'data' has 'cmd' and 'msg' fields
websocket.on ('stop', function (data) {
	console.log ('Command: ' + data.cmd);
	console.log ('Message: ' + data.msg);
});
```

## Run the demo
First of all, you need [**virtualenv**](http://www.virtualenv.org):

```bash
$ sudo apt-get install virtualenv
```

Then, make a virtual environment:

```bash
$ virtualenv venv
```

And install Tornado:

```bash
$ . /venv/bin/activate
(venv)$ easy_install tornado
```

Finally, start the server:

```bash
(venv)$ python /var/www/ExtJS-WebSocket/server.py 8888 9999 10000
```

Now, you have three websockets listening at 8888, 9999 and 10000 port on the server side!
Then, type in the address bar of your browser: *http://localhost/ExtJS-WebSocket*

## Documentation
You can build the documentation (like ExtJS Docs) with [**jsduck**](https://github.com/senchalabs/jsduck):

```bash
$ jsduck ux --output /var/www/docs
```

It will make the documentation into docs dir and it will be visible at: http://localhost/docs

## License
(GNU GPLv3)

Copyright (c) 2012 Vincenzo Ferrari <wilk3ert@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
