/**
 * Flying Stock Exchange
 * @author Jonathan Giroux (Bloutiouf)
 * @license MIT license <http://www.opensource.org/licenses/MIT>
 */

goog.provide('economy');

goog.require('goog.math');
goog.require('goog.math.Coordinate');
goog.require('lime.CanvasContext');
goog.require('lime.Director');
goog.require('lime.GlossyButton');
goog.require('lime.Label');
goog.require('lime.Layer');
goog.require('lime.Renderer');
goog.require('lime.Scene');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.MoveBy');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.Spawn');
goog.require('lime.audio.Audio');
goog.require('constants');

function scoreColor(score) {
	if (score > constants.initialScore / 2) {
		var t = (score - constants.initialScore / 2) / (constants.initialScore / 2);
		return 'rgb(' + Math.floor(204 * (1 - t)) + ',204,0)';
	} else {
		var t = score / (constants.initialScore / 2);
		return 'rgb(204,' + Math.floor(204 * t) + ',0)';
	}
}

economy.start = function() {
	var div = document.getElementById('game');
	div.style.width = constants.width + 'px';
	div.style.height = constants.height + 'px';
	
	var director = new lime.Director(div, constants.width, constants.height),
		scene = new lime.Scene();

	var skyLayer = new lime.Layer();
	scene.appendChild(skyLayer);
	
	for (var i = 0; i < 2; ++i) {
		var sprite = new lime.Sprite().setFill(constants.assetPath + 'sky.png').setAnchorPoint(0, 0).setPosition(i * 1600, 0);
		skyLayer.appendChild(sprite);
	}
	
	var skyX = 0;
	
	var backgroundLayer = new lime.Layer();
	scene.appendChild(backgroundLayer);
	
	for (var i = 0; i < 5; ++i) {
		var sprite = new lime.Sprite().setFill(constants.assetPath + 'background.png').setAnchorPoint(0, 0).setPosition(i * 256, 0);
		backgroundLayer.appendChild(sprite);
	}
	
	var bgX = 0;
	
	var toySprite = new lime.Sprite();
	scene.appendChild(toySprite);
	
	var childSprite = new lime.Sprite().setFill(constants.assetPath + 'childb.png').setOpacity(0);
	backgroundLayer.appendChild(childSprite);
	
	var curve = [];
	
	var canvas = new lime.CanvasContext().setSize(constants.width, constants.height).setAnchorPoint(0, 0);
	canvas.draw = function(ctx) {
		ctx.lineWidth = 5;
		ctx.lineCap = 'round'; 
		for (var i = 0; i < curve.length - 1; ++i) {
			p1 = curve[i];
			p2 = curve[i+1];
			ctx.strokeStyle = (p2.y > p1.y) ? '#CC0000' : '#00CC00';
			
			ctx.beginPath();
			ctx.moveTo(p1.x, p1.y);
			ctx.lineTo(p2.x, p2.y);
			ctx.stroke();
		}
	}
	scene.appendChild(canvas);
	
	var bonusLayer = new lime.Layer()
	scene.appendChild(bonusLayer);
	
	var planeLayer = new lime.Layer();
	scene.appendChild(planeLayer);
	
	var planeSprite = new lime.Sprite().setFill(constants.assetPath + 'plane.png').setAnchorPoint(0.5, 0.5);
	planeLayer.appendChild(planeSprite);
	
	var planeX = -32;
	var planeY = constants.height / 2;
	var planeSpeed = constants.initialSpeed;
	
	var mouseX = constants.width / 2;
	var mouseY = constants.height / 2;
	
	planeSprite.setPosition(planeX, planeY);
	
	var interfaceLayer = new lime.Layer();
	scene.appendChild(interfaceLayer);
	
	var startButton = new lime.GlossyButton('Start playing').setColor('#00FF00').setSize(320, 80)/*.setScale(2, 2)*/.setPosition(constants.width / 2, constants.height / 2);
	interfaceLayer.appendChild(startButton);
	
	var startCountLabel = new lime.Label().setFontColor('#000000').setFontSize(60).setOpacity(0).setPosition(constants.width / 2, constants.height / 2);
	interfaceLayer.appendChild(startCountLabel);
	
	var crashLabel = new lime.Label('CRASH').setFontColor('#FF0000').setFontSize(120).setOpacity(0);
	interfaceLayer.appendChild(crashLabel);
	
	var dateLabel = new lime.Label('').setFontColor('#000000').setFontSize(20).setPosition(constants.width - 20, 20).setAnchorPoint(1, 0).setAlign('right');
	interfaceLayer.appendChild(dateLabel);
	
	var scoreLabel = new lime.Label('').setFontColor('#00CC00').setFontSize(50).setPosition(constants.width - 20, 50).setAnchorPoint(1, 0).setAlign('right');
	interfaceLayer.appendChild(scoreLabel);
	
	director.replaceScene(scene);
	
	var wind = new lime.audio.Audio(constants.assetPath + 'wind.ogg');
	wind.baseElement.loop = true;
	
	var chimes = new lime.audio.Audio(constants.assetPath + 'chimes.mp3');
	var chimeTimes = [
		0.354,
		1.808,
		3.314,
		4.736,
		6.159,
		7.532
	];
	
	goog.events.listen(div, 'mousemove', function(event) {
		if (event.pageX == null)
		{
			// IE case
			mouseX = event.clientX + document.body.scrollLeft - div.offsetLeft;
			mouseY = event.clientY + document.body.scrollTop - div.offsetTop;
		}
		else
		{
			// all other browsers
			mouseX = event.pageX - div.offsetLeft;
			mouseY = event.pageY - div.offsetTop;
		}
	});
	
	var playing = false;
	var crashed = false;
	var score;
	var date;
	var bonusTimeout = 0;
	var bonuses = [];
	var angle = 0;
	var curveTimeout = 0;
	var planePosition;
	var chimeTimeout = 0;
	
	var start = function() {
		playing = false;
		crashed = false;
		planeX = 210;
		planeY = 580;
		planeSpeed = constants.initialSpeed;
		angle = -0.2;
		bgX = 0;
		score = constants.initialScore;
		scoreLabel.setText('$' + Math.round(score)).setFontColor(scoreColor(score));
		date = new Date();
		dateLabel.setText(date.toLocaleDateString());
		bonusTimeout = 0;
		bonuses = [];
		bonusLayer.removeAllChildren();
		curveTimeout = 0;
		planePosition = new goog.math.Coordinate(planeX, planeY);
		curve = [planePosition];
		canvas.update();
		toySprite.setPosition(-128, 0);
		
		wind.baseElement.volume = 0;
		
		childSprite.setFill(constants.assetPath + 'childa.png').setPosition(256, 650).setOpacity(1);
		
		var startCountIndex = 3;
		var startCount = function() {
			var text = startCountIndex || 'GO';
			var animation = new lime.animation.Spawn(
				new lime.animation.FadeTo(0).setDuration(.3),
				new lime.animation.ScaleTo(2).setDuration(.2)
			);
			startCountLabel.setText(text).setOpacity(1).setScale(1).runAction(animation);
			
			if (!startCountIndex) {
				playing = true;
				planeX = constants.width / 4;
				childSprite.setFill(constants.assetPath + 'childb.png');
				var animation = new lime.animation.FadeTo(0).setDuration(.3);
				childSprite.runAction(animation);
				wind.play();
			} else {
				--startCountIndex;
				goog.events.listen(animation, lime.animation.Event.STOP, function() {
					setTimeout(startCount, 300);
				});
			}
		};
		setTimeout(startCount, 300);
	};
	
	var crash = function() {
		crashed = true;
		var animation = new lime.animation.Spawn(
			new lime.animation.FadeTo(1).setDuration(.2),
			new lime.animation.MoveBy(0, -100).setDuration(.2)
		);
		crashLabel.setPosition(constants.width / 2, constants.crashY).runAction(animation);
		setTimeout(function() {
			var crashAnimation = new lime.animation.Spawn(
				new lime.animation.FadeTo(0).setDuration(.2),
				new lime.animation.MoveBy(0, -100).setDuration(.2)
			);
			crashLabel.runAction(crashAnimation);
			
			var startAnimation = new lime.animation.FadeTo(1).setDuration(.2);
			startButton.setScale(1).runAction(startAnimation);
		}, 1000);
	};
	
	var playChime = function() {
		var i = goog.math.randomInt(chimeTimes.length);
		var time = chimeTimes[i];
		chimes.stop();
		chimes.baseElement.currentTime = time;
		chimes.baseElement.volume = constants.chimeVolume;
		chimes.play();
		chimeTimeout = constants.chimeDuration;
	};
	
	lime.scheduleManager.schedule(function(dt) {
		if (playing) {
			if (dt > 20) {
				dt = 20;
			}
			
			var speedX, speedY;
			var speedX, speedY;
			
			if (crashed) {
				angle += (Math.PI / 2 - angle) * 0.01;
				var speedX = planeSpeed * Math.cos(angle);
				var speedY = planeSpeed * Math.sin(angle);
			} else {
				angle = Math.atan2(mouseY - planeY, 500);
				var speedX = planeSpeed;
				var speedY = planeSpeed * Math.sin(angle);
			}
			
			var stepX = speedX * dt;
			planeY += speedY * dt;
			
			skyX = (skyX + stepX * 0.5) % 1600;
			bgX = (bgX + stepX) % 256;
			
			planePosition.x = planeX;
			planePosition.y = planeY;
			
			for (var i = 0; i < bonuses.length; ++i) {
				var bonus = bonuses[i];
				var position = bonus.sprite.getPosition();
				position.x -= stepX * constants.bonusSpeed;
				bonus.sprite.setPosition(position)
				
				if (!crashed && !bonus.taken && goog.math.Coordinate.distance(position, planePosition) < 32) {
					bonus.taken = true;
					score += bonus.score;
					
					var animation = new lime.animation.Spawn(
						new lime.animation.FadeTo(0).setDuration(.5),
						new lime.animation.ScaleTo(2).setDuration(.5)
					);
					bonus.sprite.runAction(animation);
					playChime();
				}
				
				if (position.x < -32) {
					bonusLayer.removeChild(bonus.sprite);
					bonuses.splice(i, 1);
					--i;
				}
			}
			
			var position = toySprite.getPosition();
			position.x -= stepX;
			if (position.x < -64) {
				var i = goog.math.randomInt(constants.toys);
				toySprite.setFill(constants.assetPath + 'toys' + i + '.png').setPosition(goog.math.uniformRandom(constants.toysXmin, constants.toysXmax), constants.toysY);
			} else {
				toySprite.setPosition(position)
			}
			
			bonusTimeout -= stepX;
			if (bonusTimeout < 0) {
				bonusTimeout = goog.math.uniformRandom(constants.bonusXmin, constants.bonusXmax);
				var bonusScore = goog.math.uniformRandom(constants.bonusScoreMin, constants.bonusScoreMax);
				var bonus = {
					sprite: new lime.Sprite().setFill(constants.assetPath + 'dollar.png').setPosition(constants.width + 32, goog.math.uniformRandom(constants.bonusYmin, constants.bonusYmax)).setScale(bonusScore / constants.bonusScoreMax),
					score: bonusScore
				};
				bonuses.push(bonus);
				bonusLayer.appendChild(bonus.sprite);
			}
			
			for (var i = 0; i < curve.length; ++i) {
				var position = curve[i];
				position.x -= stepX * constants.curveSpeed;
				
				if (position.x < -60) {
					curve.splice(i, 1);
					--i;
				}
			}
			if (planeY < constants.height) {
				--curveTimeout;
				if (curveTimeout < 0) {
					curveTimeout = 10;
					planePosition = new goog.math.Coordinate(planeX, planeY);
					curve.push(planePosition);
				}
			}
			canvas.update();
			
			if (!crashed) {
				score -= dt * constants.loss;
				
				date = new Date(date.getTime() + dt * constants.timeFactor);
				dateLabel.setText(date.toLocaleDateString());
				
				if (score < 0) {
					score = 0;
					crash();
				}
				
				scoreLabel.setText('$' + Math.round(score)).setFontColor(scoreColor(score));
				
				wind.baseElement.volume = Math.min(wind.baseElement.volume + constants.windFade * dt, 1);
			} else {
				wind.baseElement.volume = Math.max(wind.baseElement.volume - constants.windFade * dt, 0);
			}
			
			chimeTimeout -= dt;
			if (chimeTimeout <= 0) {
				chimes.baseElement.volume = Math.max(chimes.baseElement.volume - constants.chimeFade * dt, 0);
			}
		}
		
		skyLayer.setPosition(-skyX, 0);
		backgroundLayer.setPosition(-bgX, 0);
		
		planeSprite.setPosition(planeX, planeY);
		planeSprite.setRotation(-goog.math.toDegrees(angle));
	});
	
	goog.events.listen(startButton, ['mousedown', 'touchstart'], function(event) {
		var animation = new lime.animation.Spawn(
			new lime.animation.FadeTo(0).setDuration(.2),
			new lime.animation.ScaleTo(4).setDuration(.2)
		);
		startButton.runAction(animation);
		goog.events.listen(animation, lime.animation.Event.STOP, start);
	});
}

goog.exportSymbol('economy.start', economy.start);
