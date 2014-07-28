# ExtJS-WebSocket

ExtJS-WebSocket is an extension to handle and use the HTML5 WebSocket with ExtJS.

It has two classes: `Ext.ux.WebSocket` and `Ext.ux.WebSocketManager`<br/>
The first one is a wrapper for standard HTML5 WebSocket and it provides a lot of interesting and easy-to-use features.
The second one is a singleton to register different Ext.ux.WebSocket and it provides functions to work with every registered websocket at the same time.

## ExtJS 5
The new version of ExtJS 5 has requested to make a new major version of `ExtJS-WebSocket`.
Now, this new major version **v1.0.0** is located on the master branch.

## ExtJS 4 & Sencha Touch 2
It's possible to work either with ExtJS 4 and Sencha Touch 2 with previous version **v0.0.5**

## Install via Bower
First of all, install [**Bower**](http://bower.io/).

Then install `Ext.ux.WebSocket` (version v1.x.x for ExtJS 5):

```bash
$ bower install ext.ux.websocket
```

Or install `Ext.ux.WebSocket` (version v0.0.5 for ExtJS 4 & Sencha Touch 2):

```bash
$ bower install ext.ux.websocket#0.0.5
```

Now, you got the extension at the following path: *YOUR_PROJECT_PATH/bower_components/ext.ux.websocket/*

It contains **WebSocket.js** and **WebSocketManager.js** files.

Let's setup the **Ext.Loader** to require the right file:

```javascript
Ext.Loader.setConfig ({
	enabled: true ,
	paths: {
		'Ext.ux.WebSocket': 'bower_components/ext.ux.websocket/WebSocket.js' ,
		'Ext.ux.WebSocketManager': 'bower_components/ext.ux.websocket/WebSocketManager.js'
	}
});

Ext.require (['Ext.ux.WebSocket', 'Ext.ux.WebSocketManager']);
```

## Usage
Load `Ext.ux.WebSocket` and `Ext.ux.WebSocketManager` via `Ext.require`:

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
	url: 'ws://localhost:8888' ,
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
	url: 'ws://localhost:8888' ,
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
	url: 'ws://localhost:8888' ,
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

## Ext.ux.WebSocketManager features
Here's an example of the manager:

```javascript
var ws1 = Ext.create ('Ext.ux.WebSocket', {
	url: 'ws://localhost:8888'
});

Ext.ux.WebSocketManager.register (ws1);

var ws2 = Ext.create ('Ext.ux.WebSocket', {
	url: 'ws://localhost:8900'
});

Ext.ux.WebSocketManager.register (ws2);

var ws3 = Ext.create ('Ext.ux.WebSocket', {
	url: 'ws://localhost:8950'
});

Ext.ux.WebSocketManager.register (ws3);

Ext.ux.WebSocketManager.listen ('system shutdown', function (ws, data) {
	Ext.Msg.show ({
		title: 'System Shutdown' ,
		msg: data ,
		icon: Ext.Msg.WARNING ,
		buttons: Ext.Msg.OK
	});
});

// This will be handled by everyone
Ext.ux.WebSocketManager.broadcast ('system shutdown', 'BROADCAST: the system will shutdown in few minutes.');

Ext.ux.WebSocketManager.closeAll ();

Ext.ux.WebSocketManager.unregister (ws1);
Ext.ux.WebSocketManager.unregister (ws2);
Ext.ux.WebSocketManager.unregister (ws3);
```

## Cool Configurations
Follows some cool configurations to customize `Ext.ux.WebSocket`

### autoReconnect
By default, `Ext.ux.WebSocket` tries to re-open the connection with an internal task if it gets closed: it tries every 5 seconds.
Now, if you want to disable this behaviour, set autoReconnect to false:

```javascript
var websocket = Ext.create ('Ext.ux.WebSocket', {
	url: 'ws://localhost:8888' ,
	autoReconnect: false
});
```

In this case, when the server listens again, the websocket won't estabilish the connection.
Otherwise, if you want to change the reconnect timeslice, set autoReconnectionInterval in milliseconds:

```javascript
var websocket = Ext.create ('Ext.ux.WebSocket', {
	url: 'ws://localhost:8888' ,
	autoReconnect: true ,
	autoReconnectInterval: 1000
});
```

While in this case, the websocket tries to re-open the connection with the server every second.

### lazyConnection
Setting this config to true it will let the websocket to open the connection after its initialization:

```javascript
var websocket = Ext.create ('Ext.ux.WebSocket', {
	url: 'ws://localhost:8888' ,
	lazyConnection: true
});

// other stuff

websocket.open ();
```

When the **open** method is called, the websocket open the connection with the server.
By default, this config is set to **false**

### keepUnsentMessages
The connection gets closed by the server but the websocket still sends messages to it.
By default, those messages are discarded but if you want to keep them and then send them back after the connection is re-estabilished, just set keepUnsentMessages to true:

```javascript
var websocket = Ext.create ('Ext.ux.WebSocket', {
	url: 'ws://localhost:8888' ,
	keepUnsentMessages: true
});
```

The websocket will send every unsent messages in one shot.

## Run the demo
First of all, you need [**NodeJS**](http://nodejs.org/) and [**NPM**](https://www.npmjs.org/).

Then, install every dependencies:

```bash
$ npm install
```

Open a websocket for each port you want:

```bash
$ node demo/server.js 9001 9002 9003
```

Now, you have three websockets listening at 9001, 9002 and 9003 port on the server side!
Then, type in the address bar of your browser: **http://localhost/ExtJS-WebSocket/demo** and play the demo ;)

## Documentation
You can build the documentation (like ExtJS Docs) with [**jsduck**](https://github.com/senchalabs/jsduck):

```bash
$ jsduck ux --output /var/www/docs
```

It will make the documentation into docs dir and it will be visible at: http://localhost/docs

## License
The MIT License (MIT)

Copyright (c) 2013 Vincenzo Ferrari <wilk3ert@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
