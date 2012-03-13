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
	
	var bonusLayer = new lime.Layer().setPosition(constants.width / 2, 0);
	scene.appendChild(bonusLayer);
	
	var planeLayer = new lime.Layer();
	scene.appendChild(planeLayer);
	
	var planeSprite = new lime.Sprite().setFill(constants.imagesPath + 'plane.png').setAnchorPoint(0.5, 0.5);
	planeLayer.appendChild(planeSprite);
	
	var planeX = 0;
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
/*
	director.makeMobileWebAppCapable();

	//add some interaction
	goog.events.listen(target,['mousedown','touchstart'],function(e){

		//animate
		target.runAction(new lime.animation.Spawn(
			new lime.animation.FadeTo(.5).setDuration(.2),
			new lime.animation.ScaleTo(1.5).setDuration(.8)
		));

		title.runAction(new lime.animation.FadeTo(1));

		//let target follow the mouse/finger
		e.startDrag();

    event.swallow(['touchmove', 'mousemove'],
        goog.bind(this.moveHandler_, this));
    event.swallow(['touchend', 'touchcancel', 'mouseup'],
        goog.bind(this.releaseHandler_, this));

		//listen for end event
		e.swallow(['mouseup','touchend'],function(){
			target.runAction(new lime.animation.Spawn(
				new lime.animation.FadeTo(1),
				new lime.animation.ScaleTo(1),
				new lime.animation.MoveTo(512,384)
			));

			title.runAction(new lime.animation.FadeTo(0));
		});


	});
*/
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
	var dollarBonus, upBonus, downBonus;

	var bonus = {
		dollar: {
			filename: 'dollar.png',
			min: 600,
			max: 800,
			handler: function() {
			}
		},
		up: {
			filename: 'up.png',
			min: 1000,
			max: 2000,
			handler: function() {
				planeSpeed += constants.bonusUp;
			}
		},
		down: {
			filename: 'down.png',
			min: 1000,
			max: 3000,
			handler: function() {
				planeSpeed += constants.bonusDown;
				if (planeSpeed < 0) {
					planeSpeed = 0;
				}
			}
		}
	};
	
	var newBonus = function(i) {
		if (!bonus[i].sprite) {
			bonus[i].sprite = new lime.Sprite().setFill(constants.imagesPath + bonus[i].filename).setAnchorPoint(0.5, 0.5);
		}
		bonus[i].sprite.setOpacity(1).setScale(1).setPosition(Math.max(goog.math.uniformRandom(bonus[i].min, bonus[i].max) / (bonus[i].rate || 1), constants.width / 2 + 32), goog.math.uniformRandom(constants.bonusYmin, constants.bonusYmax));
		delete bonus[i].took;
		bonusLayer.appendChild(bonus[i].sprite);
	};
	
	var start = function() {
		playing = false;
		crashed = false;
		planeX = 0;
		planeY = constants.height / 2;
		planeSpeed = constants.initialSpeed;
		bgX = 0;
		
		for (var i in bonus) {
			newBonus(i);
		}
		
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
		var angle = 0;
		if (playing) {
			if (dt > 20) {
				dt = 20;
			}
			
			var angleRadians = Math.atan2(mouseY - planeY, 500);
			if (crashed) {
				angleRadians = 0;
			}
			
			angle = goog.math.toDegrees(angleRadians);
			
			if (crashed) {
				planeSpeed *= constants.groundFriction;
			} else {
				planeSpeed *= constants.friction;
			}
			
			var speedX = planeSpeed * Math.cos(angleRadians);
			var speedY = (crashed) ? 0 : (planeSpeed * Math.sin(angleRadians) +Math.exp(- planeSpeed * constants.stall) * constants.gravity * dt);
			
			planeSpeed = Math.sqrt(speedX * speedX + speedY * speedY);
			
			var stepX = speedX * dt;
			planeX += stepX;
			planeY += speedY * dt;
			
			bgX = (bgX + stepX) % 256;
			
			var planePosition = new goog.math.Coordinate(0, planeY);
			for (var i in bonus) {
				var position = bonus[i].sprite.getPosition();
				position.x -= stepX * constants.bonusSpeed;
				bonus[i].sprite.setPosition(position)
				if (!bonus[i].took && goog.math.Coordinate.distance(position, planePosition) < 32) {
					bonus[i].took = true;
					var animation = new lime.animation.Spawn(
						new lime.animation.FadeTo(0).setDuration(.5),
						new lime.animation.ScaleTo(2).setDuration(.5)
					);
					bonus[i].sprite.runAction(animation);
					bonus[i].handler();
				}
				if (position.x < - constants.width / 2 - 32) {
					newBonus(i);
				}
			}
			
			if (planeY >= constants.crashY) {
				planeY = constants.crashY;
				if (!crashed) {
					crash();
				}
			}
		}
		
		backgroundLayer.setPosition(-bgX, 0);
		
		planeSprite.setPosition(constants.width / 2, planeY);
		planeSprite.setRotation(-angle);
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
