
;(function(){
	'use strict';

	var undefined,
		global = Function('return this')(),

		oldConsole = global.console || undefined,
		console,
		outputHandle,
		print = {},

		hasOwn = print.hasOwnProperty,
		
		method = ['log','warn','info'],
		
		slice = method.slice,

		wrap,
		shine = {

		},
		tmpl = (['<div class="{{namespace}}console-inner {{namespace}}console-{{type}} {{namespace}}console-{{style}}">',
					'<div class="{{namespace}}console-col-left">' ,
					'<i class="{{namespace}}console-icon {{namespace}}console-icon-{{type}}">{{count}}</i>',
					'<span class="{{namespace}}console-message">{{message}}</span>' ,
					'<span class="{{namespace}}console-count"></span>' ,
					'</div>' ,
					'<div class="{{namespace}}console-col-right">' ,
					//'<span class="{{namespace}}console-route">{{route}}</span>',
					'<span class="{{namespace}}console-coord">(line:{{row}},column:{{col}})</span>' ,
					'<span class="{{namespace}}console-file">{{file}}</span>' ,
					'</div>',
				'</div>'
				]).join('\n');

	function extend( dest,src ){
		var hOwn = hasOwn,
			args = slice.call( arguments ),
			len = args.length;

		function copy( d,s ){
			for( var k in s ){
				if( hOwn.call( s,k ) ){
					d[ k ] = s[ k ];
				}
			}

			return d;
		}

		switch( len ){
			case 0:
				return;
			case 1:
				return dest;
			case 2:
				return copy( dest,src );
			default:
				for( var i = 1;i < len; i++ ){
					copy( dest,args[i] );
				}
		}

		return dest;
	}

	function renderTpl( tpl,data ){
		var ret;
		if( data ){
			if( typeof tpl == 'string' ){
				ret = tpl.replace(/{{(\w+)}}/g,function($1,$2){
					var p = data[ $2 ];

					return p === undefined ? '' : p;
				});
			}
		}

		return ret ? ret : tpl;
	}
		
	function buildStyleSheet( ns ){
		var style,
			sheet,
			doc = global.document,
			head = doc.head;

		style = doc.createElement('style');
		sheet = (function(){			
			var sheet = (function(){
				/*
				.console-wrap{
					position:fixed;
					right:0;
					top:0;
					display:none;
					overflow-x:hidden;
					font-size:12px;
					color:#5b5b5b;
					letter-space:1px;
				}
				.console-inner{
					overflow:hidden;
					padding:10px;
					border-top:1px solid #dddddd;
				}
				.console-icon{
					position:relative;
					border-radius: 3px;
					font-style:normal;
					padding:2px 5px;
					color: #ffffff;
					top:-1px;
				}
				.console-icon-log{
					background-color: #dddddd;
				}
				.console-icon-warn{
					background-color:orange;
				}
				.console-icon-info{
					background-color:blue;
				}
				.console-even{
					background-color:#fafafc;
				}
				.console-col-left{
					float:left;
				}
				.console-col-right{
					float: right;
				}
				.console-message{
					
				}
				*/
			}).toString(),
			list = [],
			namespace = ns;

			sheet = sheet.replace(/[\r\n\t]*/g,'');
			sheet.replace(/\.([\w_\-]+)\s*{[\r\n]?[^}]*}/g,function(a,b,c){
				var reg = new RegExp(b);
				list.push(
					a.replace(reg,function($1){
						return namespace + b;
					})
				);
			});

			return list.join('\n');			
		})();
		
		style.innerHTML = sheet;
		head.appendChild( style );
	}

	function throttle( hdl,t,ctx,clt ){
		var timer,
			toStr = hdl.toString,
			handle;

		handle = function(){
			timer ? global.clearTimeout( timer ) : 1;

			timer = global.setTimeout(function(){
				global.clearTimeout( timer );
				hdl.call( ctx,ret );
			},t || 200);
		}
		return handle._expo = 'throttle';
	}

	function buildMethod( config ){
		var cfg = config || this.config,
			t = cfg.type,
			log;

		return extend( {}, t == 'console' ? 
			(function(){
				var list = method,
					len = list.length,
					old = oldConsole,
					p,
					a = old.log.apply,
					apply = Function.prototype.apply;
					log = {};

				while(len--){
					p = list[ len ];
					log[ p ] = function(){
						a ? old[ p ].apply( old,arguments ) : apply.call( old[p],old,argument );

					}
				}
				
				return log;
			})() : (function(){
				var wrap = cfg.wrap,
					tpl = tmpl,
					cache = wrap.innerHTML;

				return {
					log: function( msg ){
						var html = renderTpl( tpl,msg);
						
						cache += html;
						wrap.innerHTML = cache;

						return this;
					},
					info: function( msg ){
						return this.log.apply(this,arguments);
					},
					warn: function( msg ){
						return this.log.apply(this,arguments);
					},
					error: function( msg ){
						return this.log.apply(this,arguments);
					}
				}
			})()
		);
	}

	function getOutputInfo(){
		try{
			throw new Error;
		}
		catch( e ){

			if( outputHandle ){
				return outputHandle( e );
			}
			return ( outputHandle = (function(){
				var ua = global.navigator.userAgent;

				return buildHandle(
					/chrome/gi.test( ua ) && 'chrome' ||
					/safari/gi.test( ua ) && 'safari' || 
					/firefox/gi.test( ua ) && 'firefox' 
				);

				function buildHandle( tag ){
					var idx;
					switch( tag ){
						case 'safari':
							idx = 2;

							return (function(){
								var err = new Error();
								
								if( err.stack ){
									return ret;
								}
								else{
									return function( e ){
										var s = e.stack.match(/.*\n+/g),
											i = s[ idx ].match(/\/{1}([^/].*)\)?/),
											info = i[ i.length - 1 ].split('/'),
											msg = info[ info.length - 1].split(':');

										return {
											host : info.shift(),
											route : info.length > 1 ?info.join(''): '',
											file : msg[ 0 ],
											row : msg[ 1 ],
											col : msg[ 2 ]
										}	
									}
								}	
							})();
						case 'firefox':
						case 'chrome':
							idx = 2;
							return ret;					
					}
					
					function ret( e ){
						var s = e.stack.replace(/error/gi,'').match(/.+\n?/g),
							i = s[ idx ].match(/\/{1}([^/].*)\)?/),
							info = i[ i.length - 1 ].split('/'),
							msg = info.pop().split(':');

						return {
							host : info.shift(),
							route : info.length > 1 ? (info.join('')): '',
							file : msg[ 0 ],
							row : msg[ 1 ],
							col : msg[ 2 ]
						}							
					}
				}
			})())(e);
		}
	}

	function consoleWrap( key ){
		return function( msg,force ){
			var info;

			if( !this.config.debug ){
				if( force === undefined ){
					return this;
				}
				if( !force ){
					return this;
				}
			}

			info = getOutputInfo();
			info.style = this.format();
			info.type = key;
			info.count = this.count;
			info.message = msg;
			info.namespace = this.config.namespace;

			this[key + 'Context'].push( info );
			this._printHandler[ key ]( info );

			return this;
		}
	}

	console = {
		init: function( cfg ){
			var doc = global.document;
		
			cfg = extend( {},{
				type: 'console',
				namespace: '',
				wrap: doc.createElement('div')
			},cfg );

			if( !oldConsole ){
				cfg.type = 'dom';
			}

			this.config = cfg;

			cfg.namespace += cfg.namespace == '' ? '' : '-';
			buildStyleSheet( cfg.namespace );

			cfg.wrap.className = cfg.namespace + 'console';
			doc.body.appendChild( cfg.wrap );

			cfg.wrap.style.display = 'block';

			this.infoContext = [];
			this.logContext = [];
			this.warnContext = [];
			this.count = 0;

			this._printHandler = buildMethod.call( this,cfg );

			return this;
		},
		format: function(){
			this.count++;
			return this.count % 2 == 0 ? 'odd' : 'even';
		},
		log: consoleWrap('log'),
		info: consoleWrap('info'),
		warn: consoleWrap('warn'),
		clear: function( type ){
			type = type || undefined;
		}
	}

	global.console = console;		
})();
