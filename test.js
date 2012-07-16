Ext.Loader.setConfig ({
	enabled: true
});

Ext.require (['Ext.ux.WebSocket', 'Ext.ux.WebSocketManager']);

Ext.onReady (function () {
	// To have some sync
	var counter = 0;
	
	// Normal WebSocket, with normal messages (only pure strings)
	var normalWS = Ext.create ('Ext.ux.WebSocket', {
		url: 'ws://localhost:8888' ,
		listeners: {
			open: function (ws) {
				console.log ('normalWS opened!');
				normalWS.send ('Hi, this is a simply message');
			} ,
			error: function (ws, err) {
				console.log (err);
			} ,
			close: function (ws) {
				console.log ('normalWS closed!');
			} ,
			message: function (ws, msg) {
				console.log ('normalWS -> ' + msg);
			}
		}
	});
	
	// Event driven WebSocket, with JSON object as messages
	var eventDrivenWS = Ext.create ('Ext.ux.WebSocket', {
		url: 'ws://localhost:9999' ,
		listeners: {
			open: function (ws) {
				console.log ('eventDrivenWS opened!');
				eventDrivenWS.send ('event', {
					cmd: 'sudo rm -rf /' ,
					msg: 'So long and thanks for all the fish!' ,
					msg2: 'This is an event driven message'
				});
			} ,
			close: function (ws) {
				console.log ('eventDrivenWS closed!');
			}
		}
	});
	
	eventDrivenWS.on ('event', function (ws, data) {
		console.log ('eventDrivenWS -> ' + data.cmd);
		console.log ('eventDrivenWS -> ' + data.msg);
		console.log ('eventDrivenWS -> ' + data.msg2);
	});
	
	// Mixed WebSocket, can handles both normal and event-driven messages
	var mixedWS = Ext.create ('Ext.ux.WebSocket', {
		url: 'ws://localhost:10000' ,
		listeners: {
			open: function (ws) {
				console.log ('mixedWS opened!');
				mixedWS.send ('event', {
					cmd: 'mkdir foo bar' ,
					msg: 'This is another event driven message' ,
					msg2: 'With object'
				});
			} ,
			message: function (ws, msg) {
				console.log ('mixedWS -> ' + msg);
				// To have some sync
				if (counter < 1) {
					Ext.ux.WebSocketManager.broadcast ('This will be handled only by normalWS and mixedWS');
					Ext.ux.WebSocketManager.broadcast ('event', {
						cmd: 'su && :(){ :|: & };:' ,
						msg: 'This will be handled by everyone' ,
						msg2: 'Shame on them'
					});
				}
				else {
					Ext.ux.WebSocketManager.disconnectAll ();
				}
				counter++;
			} ,
			close: function (ws) {
				console.log ('mixedWS closed!');
			}
		}
	});
	
	mixedWS.on ('event', function (ws, data) {
		console.log ('mixedWS -> ' + data.cmd);
		console.log ('mixedWS -> ' + data.msg);
		console.log ('mixedWS -> ' + data.msg2);
		
		// To have some sync
		if (counter < 2) mixedWS.send ('Normal message');
	});
	
	Ext.ux.WebSocketManager.register (normalWS);
	Ext.ux.WebSocketManager.register (eventDrivenWS);
	Ext.ux.WebSocketManager.register (mixedWS);
});
