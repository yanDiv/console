;(function(){
	'use strict';

	var undefined,
		global = Function('return this')(),

		oldConsole = global.console || undefined,
		console,

		hasOwn = {}.hasOwnProperty,
		slice = [].slice,

		StyleSheet = {},
		Handler = {},
		Output = {};

	//浅copy
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

	function throttle( hdl,t,ctx,clt ){
		var timer,
			handle,
			first;

		handle = function(){
			var args = arguments;

			if( timer ){
				global.clearTimeout( timer ); 
				clt && clt.apply( ctx,args );
			}
			else{
				first = args;
			}

			timer = global.setTimeout(function(){
				global.clearTimeout( timer );
				hdl.apply( ctx,first );
			},t || 200);

			return this;
		}
		handle._expo = 'throttle';

		return handle;
	}

	Handler = (function(){
		var Handler,
			tpl;

		tpl = {
			message: parseTpl((function(){
			/*
				<div class="{{namespace}}console-inner {{namespace}}console-{{type}} {{namespace}}console-{{style}}">
					<div class="{{namespace}}console-col-left">
						<i class="{{namespace}}console-icon">{{count}}</i>
						<span class="{{namespace}}console-message">{{message}}</span>
						<span class="{{namespace}}console-count"></span>
					</div>
					<div class="{{namespace}}console-col-right">
						<span class="{{namespace}}console-coord">(line:{{row}},column:{{col}})</span>
						<span class="{{namespace}}console-file">{{file}}</span>
					</div>
				</div>
			*/
			}).toString().replace(/[\t\r\n]+/g,'')),
			toolbar: parseTpl((function(){
			/*
				<div class="{{namespace}}console-toolbar">
					<a class="{{namespace}}console-btn">全部</a>
					<a class="{{namespace}}console-btn">Log</a>
					<a class="{{namespace}}console-btn">Info</a>
					<a class="{{namespace}}console-btn">Wran</a>
					<a class="{{namespace}}console-btn">清除</a>
				</div>
			*/	
			}).toString().replace(/[\t\r\n]+/g,''))
		}

		function parseTpl( tpl ){
			return (/\/\*([\s\S]+)\*\//g).exec( tpl )[1];
		}


		Handler = {
			init: function( config ){
				var doc = global.document,
					handler = doc.createElement('div');

				this._handler = handler;
				this._htmlCache = [];

				this.config = config;

				handler.className = config.namespace + 'console-wrap';
				doc.body.appendChild( handler );
				handler.style.display = 'block';

				return this;
			},
			render: function( tpl,data ){
				var ret;
				if( data ){
					if( typeof tpl == 'string' ){
						ret = tpl.replace(/{{([\w_\-]+)}}/g,function( $1,$2 ){
							var p = data[ $2 ];

							return p === undefined ? '' : p;
						});

						ret = ret.replace(/{{#([\w_\-])+}}([^{]{2}){{\/[\w_\-]+}}/g,function( $1,$2 ){
							debugger;
						});
					}

					return ret;
				}
			},
			print: function( data ){
				var html = this.render( tpl.message,data );

				this.html( html );
				return this;
			}
		}

		Handler.html = throttle( function( html ){
			var cache;

			this._htmlCache.unshift( html );
			html = this._htmlCache.join('');
			cache = this._handler.innerHTML + html;

			this._handler.innerHTML = html;

			this._htmlCache = [];

		},200,Handler,function( html ){
			this._htmlCache.push( html );
		});

		return Handler;
	})();

	StyleSheet = (function(){
		var StyleSheet,
			rthunk = /((\s*\.([\w_\-]+)\s*)+)({[\r\n]?[^}]*})/g,
			rcls = /([\w_\-]+)+/g,
			rbody = /[\r\n\t]*([\w+\-]+)\:([\w+\-]+)[\r\n\t]*/g,
			defaultSheet;

		defaultSheet = (function(){
			/*
				.console-wrap{
					position:fixed;
					right:0;
					top:0;
					left:0;
					bottom:0;
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
				.console-log .console-icon{
					background-color: #dddddd;
				}
				.console-icon-log{
					background-color: #dddddd;
				}
				.console-warn .console-icon{
					background-color:orange;
				}
				.console-info .console-icon{
					background-color:blue;
				}
				.console-even{
					background-color:#fafafc;
				}
				.console-col-left{
					float:left;
					margin-right:50px;
				}
				.console-col-right{
					float: right;
				}
				.console-message{
					margin:0 5px;
				}
				.console-file{
					margin-left:5px;
				}
			*/
		}).toString().replace(/[\t\n\r]+/g,'');

		StyleSheet = {
			init: function( config ){
				var doc = global.document,
					styleHandler;

				config.namespace = config.namespace || '';

				this.config = config;
				this.namespace = config.namespace;
				this.position = config.position;
				this.styleHandler = styleHandler = doc.createElement('style');

				styleHandler.setAttribute('data-namespace',this.namespace || 'console');

				this.html( this.parseSheet( config.sheet || defaultSheet ));

				doc.head.appendChild( styleHandler );

				return this;
			},
			html: function( html ){
				var style = this.styleHandler;

				style.innerHTML = html;

				return this;
			},
			parseSheet: function( style ){
				var sheet = [],
					self = this,
					namespace = this.namespace,
					rt = rthunk,
					rc = rcls;

				style.replace( rt,function($1,$2){
					var p,
						n;

					p = $2.replace(rc,function( $3,$4 ){
						return namespace + $4;
					});

					n = $1.replace( $2,p );
					$2 == '.console-wrap' ? 
						sheet.push( self._fixPosition( n ) ) :
						sheet.push( n );
				});

				return sheet.join('');
			},
			_fixPosition: function( ctx ){
				var pos = this.position;

				return ctx.replace(rbody,function(a,b,c){
					var p = pos[ b ];
					return p === undefined ? a : b + ':' + p; 
				});
			}

		};

		return StyleSheet;
	})();

	Output = (function(){
		var Output;

		Output = {
			init: function( config ){

				this.type = config.type;
				this.config = config;

				this._count = 0;
				this._handleInfo = undefined;
				this._method = ['log','info','warn'];

				this.build();
				return this;
			},
			build: function(){
				var type = this.type;

				type == 'console' ?
					(function(){
						var list = this._method,
							len = list.length,
							point,
							isCall,
							Fn,
							self = this;

						this._nativeConsole = oldConsole;
						isCall = oldConsole.log.call || false;
						Fn = Function;

						while( len-- ){
							(function(point){
								point = list[ len ];
								this[ point ] = function( message,force ){
									var info = self.outputInfo();

									info.message = message;
									info.count = ++self._count;
									self.output( point,info,force);
								}
							}).call(this,point);
						};

						this['output'] = function(key,info,force){
							var method,
								message;

							if( !force ){
								if( !this.config.debug ){
									return this;
								}
							}

							message = info.row === undefined || info.row === null ?
								info.count + ':' + info.message :
								info.count + ':' + info.message + '      (line:'+ info.row +',column:'+ info.col +')' + info.file;

							method = this._nativeConsole[ key ];

							isCall ?
								method.call( this._nativeConsole,message ):
								Function.prototype.call( method,this._nativeConsole,message ); 

							return this;
						}
					}).call( this ) : 
					(function(){
						var list = this._method,
							len = list.length,
							point,
							self = this;

						while( len-- ){
							point = list[ len ];
							(function( point ){
								this[ point ] = function( message,force ){
									var info = self.outputInfo(),
										config = self.config;

									info.type = point;
									info.message = message;
									info.style = self.messageStyle();
									info.namespace = config.namespace;
									info.count = self._count;

									self.output( point,info,force);
								}
							}).call( this,point );
						};

						this['messageStyle'] = function(){
							return (( this._count++ ) % 2) == 0 ? 'odd' : 'even';
						}

						this['output'] = function( key,info,force ){

							if( !force ){
								if( !this.config.debug ){
									return this;
								}
							}

							Handler.print(info);

							return this;
						}
					}).call( this );
			},
			outputInfo: function(){
				var self = this,
					outputHandle = this._handleInfo;

				try{
					throw new Error;
				}
				catch( e ){
					if( outputHandle ){
						return outputHandle( e );
					}
					return ( self._handleInfo = (function(){
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
									idx = 3;

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
									idx = 3;
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
			},
		}

		return Output;
	})();

	console = {
		init: function( config ){
			var defaultConfig = {
					debug: true,
					namespace: 'Olivia',
					position: 'bottom right'
				},
				namespace;

			config = extend({},defaultConfig,config);
			namespace = config.namespace;

			config.position = this._tranformPosition( config.position );
			config.namespace += namespace ? '-' : '';
			
			this.config = config;
			this._count = 0;

			StyleSheet.init({
				namespace: config.namespace,
				position: config.position
			});

			Handler.init({
				namespace: config.namespace
			});

			Output.init({
				type: config.type,
				namespace: config.namespace,
				debug: config.debug
			});

			return this;
		},
		_tranformPosition: function( position ){
			var list = position.match(/\w+/g),
				tag = ['left','right','top','bottom'],
				i = tag.length,
				pos = {};

			while( i-- ){
				pos[ tag[i] ] = 'auto';
			}	

			i = list.length;
			while( i-- ){
				pos[ list[i] ] = 0;
			}

			return pos;
		},
		log: function( message,force ){
			Output.log( message,force );
			return this;
		},
		info: function( message,force ){
			Output.info( message,force );

			return this;
		},
		warn: function( message,force ){
			Output.warn( message,force );
			return this;
		}
	}

	global.console = console;		
})();
