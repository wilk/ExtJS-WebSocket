/**
 * @class Ext.ux.WebSocket
 * @author Vincenzo Ferrari <wilk3ert@gmail.com>
 *
 * Wrapper for HTML5 WebSocket
 * 
 * This class provide an interface for HTML5 WebSocket.
 * 
 * <h1>Pure text communication</h1>
 * The communication is text-only, without objects or any other kind of data.
 * 
 *     var websocket = Ext.create ('Ext.ux.WebSocket', {
 *       url: 'ws://localhost:8888' ,
 *       listeners: {
 *         open: function (ws) {
 *           console.log ('The websocket is ready to use');
 *           ws.send ('This is a simple text');
 *         } ,
 *         close: function (ws) {
 *           console.log ('The websocket is closed!');
 *         } ,
 *         error: function (ws, error) {
 *           Ext.Error.raise (error);
 *         } ,
 *         message: function (ws, message) {
 *           console.log ('A new message is arrived: ' + message);
 *         }
 *       }
 *     });
 * 
 * <h1>Pure event-driven communication</h1>
 * The communication is event-driven: an event and a String or Object are sent and the websocket handles different events.
 * 
 *     var websocket = Ext.create ('Ext.ux.WebSocket', {
 *       url: 'ws://localhost:8888' ,
 *       listeners: {
 *         open: function (ws) {
 *           console.log ('The websocket is ready to use');
 *           ws.send ('init', 'This is a simple text');
 *           ws.send ('and continue', {
 *             'my': 'data' ,
 *             'your': 'data'
 *           });
 *         } ,
 *         close: function (ws) {
 *           console.log ('The websocket is closed!');
 *         }
 *       }
 *     });
 *     
 *     // A 'stop' event is sent from the server
 *     // 'data' has 'cmd' and 'msg' fields
 *     websocket.on ('stop', function (data) {
 *       console.log ('Command: ' + data.cmd);
 *       console.log ('Message: ' + data.msg);
 *     });
 * 
 * <h1>Mixed event-driven and text communication</h1>
 * The communication is mixed: it can handles text-only and event-driven communication.
 * 
 *     var websocket = Ext.create ('Ext.ux.WebSocket', {
 *       url: 'ws://localhost:8888' ,
 *       listeners: {
 *         open: function (ws) {
 *           console.log ('The websocket is ready to use');
 *           ws.send ('This is only-text message');
 *           ws.send ('init', 'This is a simple text');
 *           ws.send ('and continue', {
 *             'my': 'data' ,
 *             'your': 'data'
 *           });
 *         } ,
 *         close: function (ws) {
 *           console.log ('The websocket is closed!');
 *         } ,
 *         message: function (ws, message) {
 *           console.log ('Text-only message arrived is: ' + message);
 *         }
 *       }
 *     });
 *     
 *     // A 'stop' event is sent from the server
 *     // 'data' has 'cmd' and 'msg' fields
 *     websocket.on ('stop', function (data) {
 *       console.log ('Command: ' + data.cmd);
 *       console.log ('Message: ' + data.msg);
 *     });
 */

Ext.define ('Ext.ux.WebSocket', {
	alias: 'widget.websocket' ,
	
	mixins: {
		observable: 'Ext.util.Observable'
	} ,
	
	config: {
		/**
		 * @cfg {String} url The URL to connect
		 */
		url: '' ,
	
		/**
		 * @cfg {String} protocol The protocol to use in the connection
		 */
		protocol: null 
	} ,
	
	/**
	 * @property {Number} CONNECTING
	 * @readonly
	 * The connection is not yet open.
	 */
	CONNECTING: 0 ,
	
	/**
	 * @property {Number} OPEN
	 * @readonly
	 * The connection is open and ready to communicate.
	 */
	OPEN: 1 ,
	
	/**
	 * @property {Number} CLOSING
	 * @readonly
	 * The connection is in the process of closing.
	 */
	CLOSING: 2 ,
	
	/**
	 * @property {Number} CLOSED
	 * @readonly
	 * The connection is closed or couldn't be opened.
	 */
	CLOSED: 3 ,
	
	/**
	 * Creates new WebSocket
	 * @param {Object} config The configuration options may be specified as follows:
	 * 
	 *     var config = {
	 *       url: 'your_url' ,
	 *       protocol: 'your_protocol'
	 *     };
	 *     
	 *     var ws = Ext.create ('Ext.ux.WebSocket', config);
	 *
	 * @return {Ext.ux.WebSocket} An instance of Ext.ux.WebSocket or null if an error occurred.
	 */
	constructor: function (cfg) {
		var me = this;
		
		me.initConfig (cfg);
		me.mixins.observable.constructor.call (me, cfg);
		
		me.addEvents (
			/**
			 * @event open
			 * Fires after the websocket has been connected.
			 * @param {Ext.ux.WebSocket} this The websocket
			 */
			'open' ,
			
			/**
			 * @event error
			 * Fires after an error occured
			 * @param {Ext.ux.WebSocket} this The websocket
			 * @param {Object} error The error object to display
			 */
			'error' ,
			
			/**
			 * @event close
			 * Fires after the websocket has been disconnected.
			 * @param {Ext.ux.WebSocket} this The websocket
			 */
			'close' ,
			
			/**
			 * @event message
			 * Fires after a message is arrived from the server.
			 * @param {Ext.ux.WebSocket} this The websocket
			 * @param {String} message The message arrived
			 */
			'message'
		);
		
		try {
			me.ws = (me.protocol === null ? new WebSocket (me.url) : new WebSocket (me.url, me.protocol));
			
			me.ws.onopen = function (evt) {
				me.fireEvent ('open', me);
			};
			
			me.ws.onerror = function (error) {
				me.fireEvent ('error', me, error);
			};
			
			me.ws.onclose = function (evt) {
				me.fireEvent ('close', me);
			};
			
			// Build the JSON message to display with the right event
			me.ws.onmessage = function (message) {
				me.fireEvent ('message', me, message.data);
				
				/*
					message.data : JSON encoded message
					msg.event : event to be raised
					msg.data : data to be handled
				*/
				try {
					var msg = Ext.JSON.decode (message.data);
					
					me.fireEvent (msg.event, me, msg.data);
				}
				catch (err) {
					// Do nothing if the message arrived can't be decoded
				}
			};
		}
		catch (err) {
			Ext.Error.raise (err);
			return null;
		}
		
		return me;
	} ,
	
	/**
	 * @method isReady
	 * Returns if the websocket connection is up or not
	 * @return {Boolean} True if the connection is up, False otherwise
	 */
	isReady: function () {
		return (this.getStatus () === this.OPEN ? true : false);
	} ,
	
	/**
	 * @method getStatus
	 * Returns the current status of the websocket
	 * @return {Number} The current status of the websocket (0: connecting, 1: open, 2: closed)
	 */
	getStatus: function () {
		return this.ws.readyState;
	} ,
	
	/**
	 * @method close
	 * Closes the websocket
	 */
	close: function () {
		this.ws.close ();
	} ,
	
	/**
	 * @method send
	 * Sends data. If there's only the first parameter (event), it sends as normal string, otherwise as a JSON encoded object
	 * @param {String/String[]} events Events that have to handled by the server
	 * @param {String/Object} data The data to send
	 */
	send: function (events, data) {
		// Treats it as normal message
		if (arguments.length === 1) {
			if (Ext.isString (events)) this.ws.send (events);
			else Ext.Error.raise ('String expected!');
		}
		// Treats it as event-driven message
		else if (arguments.length >= 2) {
			if (Ext.isString (events)) events = [events];
			
			var objData = [];
			var tmp;
			
			for (var i in events) {
				tmp = {
					event: events[i] ,
					data: data
				};
				
				objData[i] = Ext.JSON.encode (tmp);
			}
			
			for (var i in objData) {
				this.ws.send (objData[i]);
			}
		}
	}
});
