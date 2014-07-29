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

Ext.define('Ext.ux.WebSocket', {
    alias: 'websocket',

    mixins: {
        observable: 'Ext.util.Observable'
    },

    requires: ['Ext.util.TaskManager', 'Ext.util.Memento'],

    /**
     * @event open
     * Fires after the websocket has been connected.
     * @param {Ext.ux.WebSocket} this The websocket
     */

    /**
     * @event error
     * Fires after an error occured
     * @param {Ext.ux.WebSocket} this The websocket
     * @param {Object} error The error object to display
     */

    /**
     * @event close
     * Fires after the websocket has been disconnected.
     * @param {Ext.ux.WebSocket} this The websocket
     */

    /**
     * @event message
     * Fires after a message is arrived from the server.
     * @param {Ext.ux.WebSocket} this The websocket
     * @param {String/Object} message The message arrived
     */

    config: {
        /**
         * @cfg {String} url (required) The URL to connect
         */
        url: '',

        /**
         * @cfg {String} protocol The protocol to use in the connection
         */
        protocol: null,

        /**
         * @cfg {String} communicationType The type of communication. 'both' (default) for event-driven and pure-text communication, 'event' for only event-driven and 'text' for only pure-text.
         */
        communicationType: 'both',

        /**
         * @cfg {Boolean} autoReconnect If the connection is closed by the server, it tries to re-connect again. The execution interval time of this operation is specified in autoReconnectInterval
         */
        autoReconnect: true,

        /**
         * @cfg {Int} autoReconnectInterval Execution time slice of the autoReconnect operation, specified in milliseconds.
         */
        autoReconnectInterval: 5000,

        /**
         * @cfg {Boolean} lazyConnection Connect the websocket after the initialization with the open method
         */
        lazyConnection: false,

        /**
         * @cfg {Boolean} keepUnsentMessages Keep unsent messages and try to send them back after the connection is open again
         */
        keepUnsentMessages: false
    },

    /**
     * @property {Number} CONNECTING
     * @readonly
     * The connection is not yet open.
     */
    CONNECTING: 0,

    /**
     * @property {Number} OPEN
     * @readonly
     * The connection is open and ready to communicate.
     */
    OPEN: 1,

    /**
     * @property {Number} CLOSING
     * @readonly
     * The connection is in the process of closing.
     */
    CLOSING: 2,

    /**
     * @property {Number} CLOSED
     * @readonly
     * The connection is closed or couldn't be opened.
     */
    CLOSED: 3,

    /**
     * @property {Object} memento
     * @private
     * Internal memento
     */
    memento: {},

    /**
     * @property {Array} memento
     * @private
     * Internal queue of unsent messages
     */
    messageQueue: [],

    /**
     * Creates new WebSocket
     * @param {String/Object} config The configuration options may be specified as follows:
     *
     *     // with a configuration set
     *     var config = {
	 *       url: 'your_url' ,
	 *       protocol: 'your_protocol'
	 *     };
     *
     *     var ws = Ext.create ('Ext.ux.WebSocket', config);
     *
     *     // or with websocket url only
     *     var ws = Ext.create ('Ext.ux.WebSocket', 'ws://localhost:30000');
     *
     * @return {Ext.ux.WebSocket} An instance of Ext.ux.WebSocket or null if an error occurred.
     */
    constructor: function (cfg) {
        var me = this;

        // Raises an error if no url is given
        if (Ext.isEmpty(cfg)) {
            Ext.Error.raise('URL for the websocket is required!');
            return null;
        }

        // Allows initialization with string
        // e.g.: Ext.create ('Ext.ux.WebSocket', 'ws://localhost:8888');
        if (typeof cfg === 'string') {
            cfg = {
                url: cfg
            };
        }

        me.initConfig(cfg);
        me.mixins.observable.constructor.call(me, cfg);

        try {
            // Initializes internal websocket
            if (!me.getLazyConnection()) me.initWebsocket();

            me.memento = Ext.create('Ext.util.Memento');
            me.memento.capture('autoReconnect', me);
        }
        catch (err) {
            Ext.Error.raise(err);
            return null;
        }

        return me;
    },

    /**
     * @method isReady
     * Returns if the websocket connection is up or not
     * @return {Boolean} True if the connection is up, False otherwise
     */
    isReady: function () {
        return this.getStatus() === this.OPEN;
    },

    /**
     * @method getStatus
     * Returns the current status of the websocket
     * @return {Number} The current status of the websocket (0: connecting, 1: open, 2: closed)
     */
    getStatus: function () {
        return this.ws.readyState;
    },

    /**
     * @method close
     * Closes the websocket and kills the autoreconnect task, if exists
     * @return {Ext.ux.WebSocket} The websocket
     */
    close: function () {
        var me = this;

        if (me.autoReconnectTask) {
            Ext.TaskManager.stop(me.autoReconnectTask);
            delete me.autoReconnectTask;
        }
        // Deactivate autoReconnect until the websocket is open again
        me.setAutoReconnect(false);

        me.ws.close();

        return me;
    },

    /**
     * @method open
     * Re/Open the websocket
     * @return {Ext.ux.WebSocket} The websocket
     */
    open: function () {
        var me = this;

        // Restore autoReconnect initial value
        me.memento.restore('autoReconnect', false, me);
        me.initWebsocket();

        return me;
    },

    /**
     * @method send
     * Sends a message.
     * This method is bind at run-time level because it changes on the websocket initial configuration.
     * It supports three kind of communication:
     *
     *    1. text-only
     *      Syntax: ws.send (string);
     *      Example: ws.send ('hello world!');
     *    2. event-driven
     *      Syntax: ws.send (event, string/object);
     *      Example 1: ws.send ('greetings', 'hello world!');
     *      Example 2: ws.send ('greetings', {text: 'hello world!'});
     *    3. hybrid (text and event)
     *      It uses both: see examples above
     * @param {String/Object} message Can be a single text message or an association of event/message.
     */
    send: function () {
    },

    /**
     * @method initWebsocket
     * Internal websocket initialization
     * @private
     */
    initWebsocket: function () {
        var me = this;

        me.ws = Ext.isEmpty(me.getProtocol()) ? new WebSocket(me.getUrl()) : new WebSocket(me.getUrl(), me.getProtocol());

        me.ws.onopen = function (evt) {
            // Kills the auto reconnect task
            // It will be reactivated at the next onclose event
            if (me.autoReconnectTask) {
                Ext.TaskManager.stop(me.autoReconnectTask);
                delete me.autoReconnectTask;
            }

            // Flush unset messages
            if (me.getKeepUnsentMessages() && me.messageQueue.length > 0) {
                while (me.messageQueue.length > 0) {
                    // Avoid infinite loop into safeSend method
                    if (me.isReady()) me.safeSend(me.messageQueue.shift());
                    else break;
                }
            }

            me.fireEvent('open', me);
        };

        me.ws.onerror = function (error) {
            me.fireEvent('error', me, error);
        };

        me.ws.onclose = function (evt) {
            me.fireEvent('close', me);

            // Setups the auto reconnect task, just one
            if (me.getAutoReconnect() && (typeof me.autoReconnectTask === 'undefined')) {
                me.autoReconnectTask = Ext.TaskManager.start({
                    run: function () {
                        // It reconnects only if it's disconnected
                        if (me.getStatus() === me.CLOSED) {
                            me.initWebsocket();
                        }
                    },
                    interval: me.getAutoReconnectInterval()
                });
            }
        };

        if (me.getCommunicationType() === 'both') {
            me.ws.onmessage = Ext.bind(me.receiveBothMessage, this);
            me.send = Ext.bind(me.sendBothMessage, this);
        }
        else if (me.getCommunicationType() === 'event') {
            me.ws.onmessage = Ext.bind(me.receiveEventMessage, this);
            me.send = Ext.bind(me.sendEventMessage, this);
        }
        else {
            me.ws.onmessage = Ext.bind(me.receiveTextMessage, this);
            me.send = Ext.bind(me.sendTextMessage, this);
        }
    },

    /**
     * @method flush
     * It sends every message given to the websocket, checking first if is there any connection
     * If there's no connection, it enqueues the message and flushes it later
     * @param {String} Data to send
     * @return {Ext.ux.WebSocket} The websocket
     * @private
     */
    safeSend: function (data) {
        var me = this;

        if (me.isReady()) me.ws.send(data);
        else if (me.getKeepUnsentMessages()) me.messageQueue.push(data);

        return me;
    },

    /**
     * @method receiveBothMessage
     * It catches every event-driven and pure text messages incoming from the server
     * @param {Object} message Message incoming from the server
     * @private
     */
    receiveBothMessage: function (message) {
        var me = this;

        try {
            /*
             message.data : JSON encoded message
             msg.event : event to be raise
             msg.data : data to be handle
             */
            var msg = Ext.JSON.decode(message.data);
            me.fireEvent(msg.event, me, msg.data);
            me.fireEvent('message', me, msg);
        }
        catch (err) {
            if (Ext.isString(message.data)) me.fireEvent(message.data, me, message.data);
            // Message event is always sent
            me.fireEvent('message', me, message.data);
        }
    },

    /**
     * @method receiveEventMessage
     * It catches every event-driven messages incoming from the server
     * @param {Object} message Message incoming from the server
     * @private
     */
    receiveEventMessage: function (message) {
        var me = this;

        try {
            var msg = Ext.JSON.decode(message.data);
            me.fireEvent(msg.event, me, msg.data);
            me.fireEvent('message', me, msg);
        }
        catch (err) {
            Ext.Error.raise(err);
        }
    },

    /**
     * @method receiveTextMessage
     * It catches every pure text messages incoming from the server
     * @param {Object} message Message incoming from the server
     * @private
     */
    receiveTextMessage: function (message) {
        var me = this;

        try {
            me.fireEvent(message, me, message);
            // Message event is always sent
            me.fireEvent('message', me, message);
        }
        catch (err) {
            Ext.Error.raise(err);
        }
    },

    /**
     * @method sendBothMessage
     * It sends both pure text and event-driven messages to the server
     * @param {String/String[]} events Message(s) or event(s) to send to the server
     * @param {String/Object} data Message to send to the server, associated to its event
     * @return {Ext.ux.WebSocket} The websocket
     * @private
     */
    sendBothMessage: function (events, data) {
        var me = this;

        // Treats it as normal message
        if (arguments.length === 1) {
            if (Ext.isString(events)) me.safeSend(events);
            else Ext.Error.raise('String expected!');
        }
        // Treats it as event-driven message
        else if (arguments.length >= 2) {
            events = Ext.isString(events) ? [events] : events;

            for (var i = 0; i < events.length; i++) {
                var msg = {
                    event: events[i],
                    data: data
                };

                me.safeSend(Ext.JSON.encode(msg));
            }
        }

        return me;
    },

    /**
     * @method sendEventMessage
     * It sends event-driven messages to the server
     * @param {String/String[]} events Event(s) to send to the server
     * @param {String/Object} data Message to send to the server, associated to its event(s)
     * @return {Ext.ux.WebSocket} The websocket
     * @private
     */
    sendEventMessage: function (events, data) {
        var me = this;

        events = Ext.isString(events) ? [events] : events;

        for (var i = 0; i < events.length; i++) {
            var msg = {
                event: events[i],
                data: data
            };

            me.safeSend(Ext.JSON.encode(msg));
        }

        return me;
    },

    /**
     * @method sendTextMessage
     * It sends pure text messages to the server
     * @param {String} event Message to send to the server
     * @return {Ext.ux.WebSocket} The websocket
     * @private
     */
    sendTextMessage: function (event) {
        var me = this;

        me.safeSend(event);

        return me;
    }
});
