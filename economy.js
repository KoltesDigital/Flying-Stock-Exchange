/**
 * Flying Stock Exchange
 * @author Jonathan Giroux (Bloutiouf)
 * @license MIT license <http://www.opensource.org/licenses/MIT>
 */

goog.provide('economy');

goog.require('goog.math');
goog.require('goog.math.Coordinate');
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.GlossyButton');
goog.require('lime.Label');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.MoveBy');
goog.require('constants');

economy.start = function(){

	var div = document.getElementById('game');
	div.style.width = constants.width + 'px';
	div.style.height = constants.height + 'px';
	
	var director = new lime.Director(div, constants.width, constants.height),
		scene = new lime.Scene();

	var backgroundLayer = new lime.Layer();
	scene.appendChild(backgroundLayer);
	
	for (var i = 0; i < 5; ++i) {
		var sprite = new lime.Sprite().setFill(constants.imagesPath + 'background.png').setAnchorPoint(0, 0).setPosition(i * 256, 0);
		backgroundLayer.appendChild(sprite);
	}
	
	var bgX = 0;
	
	var bonusLayer = new lime.Layer()
	scene.appendChild(bonusLayer);
	
	var planeLayer = new lime.Layer();
	scene.appendChild(planeLayer);
	
	var planeSprite = new lime.Sprite().setFill(constants.imagesPath + 'plane.png').setAnchorPoint(0.5, 0.5);
	planeLayer.appendChild(planeSprite);
	
	var planeX = -32;
	var planeY = constants.height / 2;
	var planeSpeed = constants.initialSpeed;
	
	var mouseX = constants.width / 2;
	var mouseY = constants.height / 2;
	
	planeSprite.setPosition(planeX, planeY);
	
	var interfaceLayer = new lime.Layer();
	scene.appendChild(interfaceLayer);
	
	var startButton = new lime.GlossyButton('Start playing').setColor('#00FF00').setSize(160, 40).setScale(2, 2).setPosition(constants.width / 2, constants.height / 2);
	interfaceLayer.appendChild(startButton);
	
	var startCountLabel = new lime.Label().setFontColor('#000000').setFontSize(60).setOpacity(0).setPosition(constants.width / 2, constants.height / 2);
	interfaceLayer.appendChild(startCountLabel);
	
	var crashLabel = new lime.Label('CRASH').setFontColor('#FF0000').setFontSize(120).setOpacity(0);
	interfaceLayer.appendChild(crashLabel);
	
	var scoreLabel = new lime.Label('').setFontColor('#00CC00').setFontSize(40).setPosition(constants.width - 20, 20).setAnchorPoint(1, 0).setAlign('right');
	interfaceLayer.appendChild(scoreLabel);
	
	director.replaceScene(scene);
	
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
	var score = 0;
	var bonusTimeout = 0;
	var bonuses = [];
	var angle = 0;
	
	var start = function() {
		playing = false;
		crashed = false;
		planeX = constants.width / 4;
		planeY = constants.height / 2;
		planeSpeed = constants.initialSpeed;
		bgX = 0;
		score = constants.initialScore;
		scoreLabel.setText('$' + Math.round(score));
		bonusTimeout = 0;
		angle = 0;
		
		var startCountIndex = 3;
		var startCount = function() {
			var text = startCountIndex || 'GO';
			var animation = new lime.animation.Spawn(
				new lime.animation.FadeTo(0).setDuration(.2),
				new lime.animation.ScaleTo(2).setDuration(.2)
			);
			startCountLabel.setText(text).setOpacity(1).setScale(1).runAction(animation);
			
			if (!startCountIndex) {
				playing = true;
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
			startButton.setScale(2).runAction(startAnimation);
		}, 1000);
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
			
			bgX = (bgX + stepX) % 256;
			
			var planePosition = new goog.math.Coordinate(planeX, planeY);
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
				}
				
				if (position.x < - 32) {
					bonusLayer.removeChild(bonus.sprite);
					bonuses.splice(i, 1);
					--i;
				}
			}
			
			bonusTimeout -= stepX;
			if (bonusTimeout < 0) {
				bonusTimeout = goog.math.uniformRandom(constants.bonusXmin, constants.bonusXmax);
				var bonusScore = goog.math.uniformRandom(constants.bonusScoreMin, constants.bonusScoreMax);
				var bonus = {
					sprite: new lime.Sprite().setFill(constants.imagesPath + 'dollar.png').setPosition(constants.width + 32, goog.math.uniformRandom(constants.bonusYmin, constants.bonusYmax)).setScale(bonusScore / constants.bonusScoreMax),
					score: bonusScore
				};
				bonuses.push(bonus);
				bonusLayer.appendChild(bonus.sprite);
			}
			
			if (!crashed) {
				score -= dt * constants.loss;
				
				if (score < 0) {
					score = 0;
					crash();
				}
				
				scoreLabel.setText('$' + Math.round(score));
			}
		}
		
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
