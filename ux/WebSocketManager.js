/**
 * @class Ext.ux.WebSocketManager
 * @author Vincenzo Ferrari <wilk3ert@gmail.com>
 * @singleton
 * 
 * Manager of Ext.ux.WebSocket
 * 
 * This singleton provide some useful functions to use for many websockets.
 * 
 *     var ws1 = Ext.create ('Ext.ux.WebSocket', {
 *       url: 'http://localhost:8888'
 *     });
 *     
 *     Ext.ux.WebSocketManager.register (ws1);
 *     
 *     var ws2 = Ext.create ('Ext.ux.WebSocket', {
 *       url: 'http://localhost:8900'
 *     });
 *     
 *     Ext.ux.WebSocketManager.register (ws2);
 *     
 *     var ws3 = Ext.create ('Ext.ux.WebSocket', {
 *       url: 'http://localhost:8950'
 *     });
 *     
 *     Ext.ux.WebSocketManager.register (ws3);
 *     
 *     Ext.ux.WebSocketManager.broadcast ('system shutdown', 'BROADCAST: the system will shutdown in few minutes.');
 *     
 *     Ext.ux.WebSocketManager.disconnectAll ();
 *     
 *     Ext.ux.WebSocketManager.unregister (ws1);
 *     Ext.ux.WebSocketManager.unregister (ws2);
 *     Ext.ux.WebSocketManager.unregister (ws3);
 */
Ext.define ('Ext.ux.WebSocketManager', {
	singleton: true ,
	
	/**
	 * @property {Ext.util.HashMap} wsList
	 * @private
	 */
	wsList: Ext.create ('Ext.util.HashMap') ,
	
	/**
	 * @property {Number} counter Counter of registered websockets
	 * @readonly
	 */
	counter: 0 ,
	
	/**
	 * @method register
	 * Registers one or more Ext.ux.WebSocket
	 * @param {Ext.ux.WebSocket/Ext.ux.WebSocket[]} websockets WebSockets to register. Could be only one.
	 */
	register: function (websockets) {
		var me = this;
		
		// Changes websockets into an array in every case
		if (Ext.isObject (websockets)) websockets = [websockets];
		
		for (var i in websockets) {
			if (!Ext.isEmpty (websockets[i].url)) {
				me.wsList.add (websockets[i].url, websockets[i]);
				me.counter++;
			}
		}
	} ,
	
	/**
	 * @method contains
	 * Checks if a websocket is already registered or not
	 * @param {Ext.ux.WebSocket} websocket The WebSocket to find
	 * @return {Boolean} True if the websocket is already registered, False otherwise
	 */
	contains: function (websocket) {
		return this.wsList.containsKey (websocket.url);
	} ,
	
	/**
	 * @method get
	 * Retrieves a registered websocket by its url
	 * @param {String} url The url of the websocket to search
	 * @return {Ext.ux.WebSocket} The websocket or undefined
	 */
	get: function (url) {
		return this.wsList.get (url);
	} ,
	
	/**
	 * @method each
	 * Executes a function for each registered websocket
	 * @param {Function} fn The function to execute
	 */
	each: function (fn) {
		this.wsList.each (function (url, websocket, len) {
			fn (websocket);
		});
	} ,
	
	/**
	 * @method unregister
	 * Unregisters one or more Ext.ux.WebSocket
	 * @param {Ext.ux.WebSocket/Ext.ux.WebSocket[]} websockets WebSockets to unregister
	 */
	unregister: function (websockets) {
		var me = this;
		
		if (Ext.isObject (websockets)) websockets = [websockets];
		
		for (var i in websockets) {
			if (me.wsList.containsKey (websockets[i].url)) {
				me.wsList.removeAtKey (websockets[i].url);
				me.counter--;
			}
		}
	} ,
	
	/**
	 * @method broadcast
	 * Sends a message to each websocket
	 * @param {String} event The event to raise
	 * @param {String/Object} message The data to send
	 */
	broadcast: function (event, message) {
		this.multicast ([], event, message);
	} ,
	
	/**
	 * @method multicast
	 * Sends a message to each websocket, except those specified
	 * @param {Ext.ux.WebSocket/Ext.ux.WebSocket[]} websockets An array of websockets to take off the communication
	 * @param {String} event The event to raise
	 * @param {String/Object} message The data to send
	 */
	multicast: function (websockets, event, message) {
		this.getExcept(websockets).each (function (url, websocket, len) {
			if (websocket.isReady ()) {
				if ((message === undefined) || (message === null)) {
					websocket.send (event);
				}
				else {
					websocket.send (event, message);
				}
			}
		});
	} ,
	
	/**
	 * @method listen
	 * Adds an handler for events given to each registered websocket
	 * @param {String/String[]} events Events to listen
	 * @param {Function} handler The events' handler
	 */
	listen: function (events, handler) {
		if (Ext.isString (events)) events = [events];
		
		this.wsList.each (function (url, websocket, len) {
			for (var i in events) {
				websocket.on (events[i], handler);
			}
		});
	} ,
	
	/**
	 * @method listenExcept
	 * Adds an handler for events given to each registered websocket, except websockets given
	 * @param {String/String[]} events Events to listen
	 * @param {Ext.ux.WebSocket/Ext.ux.WebSocket[]} websockets WebSockets to exclude
	 * @param {Function} handler The events' handler
	 */
	listenExcept: function (events, websockets, handler) {
		if (Ext.isString (events)) events = [events];
		
		this.getExcept(websockets).each (function (url, websocket, len) {
			for (var i in events) {
				websocket.on (events[i], handler);
			}
		});
	} ,
	
	/**
	 * @method getExcept
	 * Retrieves registered websockets except the input
	 * @param {Ext.ux.WebSocket/Ext.ux.WebSocket[]} websockets WebSockets to exclude
	 * @return {Ext.util.HashMap} Registered websockets except the input
	 * @private
	 */
	getExcept: function (websockets) {
		if (Ext.isObject (websockets)) websockets = [websockets];
		
		var list = this.wsList;
			
		// Exclude websockets from the communication
		for (var i in websockets) {
			list.removeAtKey (websockets[i]);
		}
		
		return list;
	} ,
	
	/**
	 * @method close
	 * Closes a websocket
	 * @param {Ext.ux.WebSocket.Wrapper} websocket The websocket to close
	 */
	close: function (websocket) {
		var me = this;
		
		if (me.wsList.containsKey (websocket.url)) {
			me.wsList.get(websocket.url).close ();
			me.unregister (websocket);
		}
	} ,
	
	/**
	 * @method closeAll
	 * Closes any registered websocket
	 */
	closeAll: function () {
		var me = this;
		
		me.wsList.each (function (url, websocket, len) {
			websocket.close ();
			me.unregister (websocket);
		});
	}
});
