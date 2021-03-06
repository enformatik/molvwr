var __global = this;

module Molvwr.Utils {
	
	// Use polyfill for setImmediate for performance gains
	var asap = (typeof setImmediate === 'function' && setImmediate) || function(fn) { setTimeout(fn, 1); };
	var isArray = Array.isArray || function(value) { return Object.prototype.toString.call(value) === "[object Array]" };

	export function runBatch(offset, size, itemslist, itemcallback, batchname?: string) : Promise {
		if (batchname) console.log(batchname + " " + offset + "/" + itemslist.length);
		return new Promise(function(complete, error){
			asap(()=>{
				var items = itemslist.slice(offset, offset + size);
								
				items.forEach((item, index) => {
					itemcallback(item, index, index + offset);
				});
				
				if (items.length < size){
					complete();
				}else{
					//asap(()=>{					
						runBatch(offset+size, size, itemslist, itemcallback, batchname).then(complete, error);
					//});
				}
			});
		});
	}

	export class Promise {
		private _state : any;
		private _value : any;
		private _deferreds : any[];		
		
		constructor(fn) {
			if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
			if (typeof fn !== 'function') throw new TypeError('not a function');
			this._state = null;
			this._value = null;
			this._deferreds = []
	
			doResolve(fn, resolve.bind(this), reject.bind(this));
		}
		
		catch(onRejected) {
			return this.then(null, onRejected);
		}
	
		then(onFulfilled, onRejected?) {
			var me = this;
			return new Promise(function(resolve, reject) {
				handle.call(me, new Handler(onFulfilled, onRejected, resolve, reject));
			})
		}
		
		public static timeout(timeoutTime : number) : Promise {
			var me = this;
			return new Promise((resolve, reject) => {
				setTimeout(function() {
					resolve();
				}, timeoutTime);
			})
		}
	
		public static all(fake: any) : Promise {
			var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);
	
			return new Promise(function (resolve, reject) {
				if (args.length === 0) return resolve([]);
				var remaining = args.length;
				function res(i, val) {
					try {
						if (val && (typeof val === 'object' || typeof val === 'function')) {
							var then = val.then;
							if (typeof then === 'function') {
								then.call(val, function (val) { res(i, val) }, reject);
								return;
							}
						}
						args[i] = val;
						if (--remaining === 0) {
							resolve(args);
						}
					} catch (ex) {
						console.error(ex);
						reject(ex);
					}
				}
				for (var i = 0; i < args.length; i++) {
					res(i, args[i]);
				}
			});
		}
	
		public static resolve(value?) : Promise {
			if (value && typeof value === 'object' && value.constructor === Promise) {
				return value;
			}
	
			return new Promise(function (resolve) {
				resolve(value);
			});
		}
	
		public static reject(value?) : Promise {
			return new Promise(function (resolveCallback, rejectCallback) {
				rejectCallback(value);
			});
		}
	
		public static race(values) : Promise {
			return new Promise(function (resolveCallback, rejectCallback) {
				for(var i = 0, len = values.length; i < len; i++) {
					values[i].then(resolveCallback, rejectCallback);
				}
			});
		}
	
		/**
		* Set the immediate function to execute callbacks
		* @param fn {function} Function to execute
		* @private
		*/
		private static _setImmediateFn(fn) {
			asap = fn;
		}
	}

	function handle(deferred) {
		var me = this;
		if (this._state === null) {
			this._deferreds.push(deferred);
			return
		}
		asap(function() {
			var cb = me._state ? deferred.onFulfilled : deferred.onRejected
			if (cb === null) {
				(me._state ? deferred.resolve : deferred.reject)(me._value);
				return;
			}
			var ret;
			try {
				ret = cb(me._value);
			}
			catch (e) {
				console.error(e);
				deferred.reject(e);
				return;
			}
			deferred.resolve(ret);
		})
	}

	function resolve(newValue) {
		try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
			if (newValue === this) throw new TypeError('A promise cannot be resolved with itself.');
			if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
				var then = newValue.then;
				if (typeof then === 'function') {
					doResolve(then.bind(newValue), resolve.bind(this), reject.bind(this));
					return;
				}
			}
			this._state = true;
			this._value = newValue;
			finale.call(this);
		} catch (e) { 
			console.error(e);
			reject.call(this, e); 
		}
	}

	function reject(newValue) {
		this._state = false;
		this._value = newValue;
		finale.call(this);
	}

	function finale() {
		for (var i = 0, len = this._deferreds.length; i < len; i++) {
			handle.call(this, this._deferreds[i]);
		}
		this._deferreds = null;
	}

	function Handler(onFulfilled, onRejected, resolve, reject){
		this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
		this.onRejected = typeof onRejected === 'function' ? onRejected : null;
		this.resolve = resolve;
		this.reject = reject;
	}

	/**
	 * Take a potentially misbehaving resolver function and make sure
	 * onFulfilled and onRejected are only called once.
	 *
	 * Makes no guarantees about asynchrony.
	 */
	function doResolve(fn, onFulfilled, onRejected) {
		var done = false;
		try {
			fn(function (value) {
				if (done) return;
				done = true;
				onFulfilled(value);
			}, function (reason) {
				if (done) return;
				done = true;
				onRejected(reason);
			})
		} catch (ex) {
			console.error(ex);
			if (done) return;
			done = true;
			onRejected(ex);
		}
	}

	


}