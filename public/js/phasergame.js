var socket;

var sprite;
var spriteHp;
var sId;
var bullets;
var enemyBullets;

var fireRate = 100;
var nextFire = 0;

var score;

var cursors;
var platforms;
var currentId;

var nickScore;

var enemies = [];
var enemNumber = 0;

var $gameOver;
var $changeNick;
var nick = "";

$(document).ready(function () {

    $changeNick = $('#userName');

    $gameOver = $('#gameOver');

    $(document).keyup(function (e) {
        if (e.keyCode == 27) {
            $changeNick.css({
                display: 'none'
            });
        }

        if (e.keyCode == 67) {

            $changeNick.css({
                display: ''
            });
        }
    });

    $changeNick.keypress(function (event) {

        var keycode = (event.keyCode ? event.keyCode : event.which);

        if (keycode == '13') {
            nick = $changeNick.children('input').val();
            if (nick != '') {
                nickScore.setText(nick + " ( " + score + "P )");
                $changeNick.css({
                    display: 'none'
                });
                socket.emit("setNick", sId, nick);
            } else {
                alert('Nick nie moze byc pusty');
            }
        }
    });


    EnemySprite = function (i, x, y, game, id, nick) {

        this.game = game;
        this.health = 3;

        this.id = id;
        this.alive = true;

        this.nick = nick;

        this.enemyBullets = game.add.group();

        this.enemyBullets.enableBody = true;
        this.enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;

        this.enemyBullets.createMultiple(50, 'bullet');
        this.enemyBullets.setAll('checkWorldBounds', true);
        this.enemyBullets.setAll('outOfBoundsKill', true);

        this.enemy = game.add.sprite(x, y, 'snowMan');
        this.enemy.anchor.set(0.5);
        this.enemy.name = i.toString();

        game.physics.arcade.enable(this.enemy);
        this.enemy.body.collideWorldBounds = true;
        this.enemy.body.gravity.y = 500;

        var style = {
            font: "10px Arial",
            fill: "#FFFFFF",
            wordWrap: true,
            wordWrapWidth: sprite.width,
            align: "center"
        };

        var data = 'error unexpected token DATATOKENERROR';

        this.score = 0;

        if (nick != '') {
            data = this.nick + " ( " + this.score + "P )";
        } else {
            data = this.id + " ( " + this.score + "P )";
        }
        this.nickScore = game.add.text(Math.floor(this.enemy.x - this.enemy.width / 2), Math.floor(this.enemy.y - this.enemy.height), data, style);


    };

    EnemySprite.prototype.hit = function () {

        this.health -= 1;

        if (this.health <= 0) {
            this.alive = false;
            return true;
        }

        return false;
    };

    Array.prototype.clean = function (obj) {
        var i = this.length;
        while (i--) {
            if (this[i] === obj) {
                this.splice(i, 1);
            }
        }
    };


    var game = new Phaser.Game(2000, 2000, Phaser.CANVAS, 'phaser-example', {
        preload: preload,
        create: create,
        update: update,
        render: render
    });

    function preload() {

        game.load.image('arrow', 'http://examples.phaser.io/assets/sprites/arrow.png');
        game.load.image('snowMan', '/img/OpponentSnowMan.png');
        game.load.image('bullet', 'http://examples.phaser.io/assets/sprites/purple_ball.png');
        game.load.image('platform', '/img/awefg.jpg');
        //    game.load.image('background', '/img/background.jpg');
    }

    function create() {


        //    game.add.image(0, 0, 'background');
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.stage.backgroundColor = '#313131';

        game.world.setBounds(0, 0, 2000, 2000);
        game.stage.disableVisibilityChange = true;


        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;

        bullets.createMultiple(50, 'bullet');
        bullets.setAll('checkWorldBounds', true);
        bullets.setAll('outOfBoundsKill', true);


        sprite = game.add.sprite(400, 300, 'arrow');
        sprite.anchor.set(0.5);

        console.log(sprite.width + " " + sprite.height);

        game.physics.arcade.enable(sprite);

        sprite.body.collideWorldBounds = true;
        sprite.body.gravity.y = 500;
        spriteHp = 3;
        score = 0;

        var style = {
            font: "10px Arial",
            fill: "#FFFFFF",
            wordWrap: true,
            wordWrapWidth: sprite.width,
            align: "center"
        };

        nickScore = game.add.text(0, 0, "Marian ( 0p )", style);

        cursors = game.input.keyboard.createCursorKeys();
        game.camera.follow(sprite);

        sprite.body.allowRotation = false;


        platforms = game.add.physicsGroup();

        platforms.create(500, 150, 'platform');
        platforms.create(0, 150, 'platform');
        platforms.create(100, 300, 'platform');
        platforms.create(400, 450, 'platform');
        platforms.create(1100, 300, 'platform');

        platforms.setAll('body.immovable', true);

        if (!socket || !socket.connected) {
            socket = io({
                forceNew: true
            });
        }

        socket.on('createMeWorld', function () {

            var world = [];

            for (var i = 0; i < 40; i++) {
                var x = game.world.randomX;
                var y = game.world.randomY;
                var plat = {
                    x: x,
                    y: y
                };
                world.push(plat);
            }
            socket.emit('worldCreation', world);
        });


        socket.on('connect', function () {
            console.log('Nawiązano połączenie przez Socket.io');
            socket.emit('newPlayer', sprite.x, sprite.y);

        });

        socket.on('updatePlayers', function (data) {
            enemies.forEach(function (enem, i) {
                enem.enemy.kill();
                enemies.clean(enem);
            });
            data.forEach(function (enem, i) {
                enemies.push(new EnemySprite(enemies.length, enem.x, enem.y, game, enem.id, enem.nick));
            });
        });

        socket.on('updatePlayer', function (id, x, y) {
            enemies.forEach(function (enem, i) {
                if (enem.id == id) {
                    enem.enemy.x = x;
                    enem.enemy.y = y;
                }
            });
        });

        socket.on('setId', function (id) {
            sId = id;
            nickScore.setText(sId + " ( 0p ) ");
        });

        socket.on('additionalPlayer', function (id, x, y, nick) {
            console.log(nick + "." + enemies.length);

            if (id != sId) {

                enemies.push(new EnemySprite(enemies.length, x, y, game, id, nick));
                console.log(enemies.length + " " + id);

            }

        });

        socket.on('cleanPlayer', function (id) {
            console.log(id);
            enemies.forEach(function (enem, i) {
                if (enem.id == id) {
                    enem.enemy.kill();
                    enem.nickScore.kill();
                    enemies.clean(enem);
                }
            });
        });

        socket.on('changeVelX', function (id, value) {
            enemies.forEach(function (enem, i) {
                if (enem.id == id) {
                    enem.enemy.body.velocity.x = value;
                }
            });
        });

        socket.on('changeVelY', function (id, value) {
            enemies.forEach(function (enem, i) {
                if (enem.id == id) {
                    enem.enemy.body.velocity.y = value;
                }
            });
        });

        socket.on('showDaBullet', function (x, y, id) {
            enemies.forEach(function (enem) {
                if (enem.id == id) {
                    //                console.log(x+ " " + y + " " + enem.enemy.x + " " + enem.enemy.y);
                    var bullet = enem.enemyBullets.getFirstDead();
                    bullet.reset(enem.enemy.x - 8, enem.enemy.y - 8);
                    game.physics.arcade.moveToXY(bullet, x, y, 500);
                }
            });
        });

        socket.on('resetEnemy', function (id, x, y) {
            enemies.forEach(function (enem) {
                if (enem.id == id) {
                    enem.enemy.kill();
                    enem.nickScore.kill();
                    enem.enemy.reset(x, y);
                    enem.nickScore.reset(Math.floor(enem.enemy.x - enem.enemy.width / 2), Math.floor(enem.enemy.y - enem.enemy.height));
                    enem.health = 3;
                }

            });
        });

        socket.on('updateKiller', function (killer) {
            enemies.forEach(function (enem) {
                if ((enem.id == killer)) {
                    console.log('killer : ' + killer + " " + enem.score);
                    enem.score += 100;
                    var data = "ERRORUNCAUGHTARG";
                    if (enem.nick != '') {
                        data = enem.nick + " ( " + enem.score + "P )";
                    } else {
                        data = killer + " ( " + enem.score + "P )";
                    }

                    enem.nickScore.setText(data);
                }
            });
        });

        socket.on('score', function (data) {
            console.log(data);

            score += 100;

            var data = "ERROR101UNCAUGHTARG";
            if (nick != '') {
                data = nick + " ( " + score + "P )";
            } else {
                data = sId + " ( " + score + "P )";
            }

            nickScore.setText(data);
            if (score >= 500) {
                if (nick != '') socket.emit('gameOver', nick, score);
                else socket.emit('gameOver', sId, score);
            }

        });

        socket.on('setEnemyNick', function (id, nick) {
            console.log('wywolano funkcje setnick');
            enemies.forEach(function (enem) {
                if (enem.id == id) {
                    enem.nick = nick;
                    enem.nickScore.setText(enem.nick + " ( " + enem.score + "P )");
                }

            });
        });

        socket.on('createMeNewWorld', function () {

            var world = [];

            for (var i = 0; i < 40; i++) {
                var x = game.world.randomX;
                var y = game.world.randomY;
                var plat = {
                    x: x,
                    y: y
                };
                world.push(plat);
            }
            socket.emit('newMap', world);
        });
        socket.on('createNewUniverse', function (universe) {
            platforms.removeAll();
            universe.forEach(function (platform, i) {
                platforms.create(platform.x, platform.y, 'platform');
            });
            platforms.setAll('body.immovable', true);
        });

        socket.on('showGameOverScreen', function (winner, score) {
            $gameOver.show();
            var i=5;
            $gameOver.children('#data').html('Wygral: ' + winner + '<br> Punktow: ' + score + '<br> Nowa gra za');
            $gameOver.children('#time').html(i);
            var timeInterval = setInterval(function(){
                i--;
                $gameOver.children('#time').html(i);
            }, 1000);
            
            setTimeout(function () {
                $gameOver.hide();
                clearInterval(timeInterval);
            }, 5000);
        });

        socket.on('loadNewMap', function (world) {
            platforms.removeAll();
            world.forEach(function (platform, i) {
                platforms.create(platform.x, platform.y, 'platform');
            });
            platforms.setAll('body.immovable', true);
            var x = game.world.randomX;
            var y = game.world.randomY;
            sprite.reset(x, y);
            socket.emit('updatePos', sId, sprite.x, sprite.y);
            score = 0;
            spriteHp = 3;

            var data = "ERROR101UNCAUGHTARG";
            if (nick != '') {
                data = nick + " ( " + score + "P )";
            } else {
                data = sId + " ( " + score + "P )";
            }

            nickScore.setText(data);

            enemies.forEach(function (enemy) {
                enemy.score = 0;
                var data = 'enemyError';
                
                if (enemy.nick != '') {
                    data = enemy.nick + " ( " + enemy.score + "P )";
                } else {
                    data = enemy.id + " ( " + enemy.score + "P )";
                }
                enemy.nickScore.setText(data);
            });
        });

        setInterval(function () {
            socket.emit('updatePos', sId, sprite.x, sprite.y);
        }, 3000);

    }


    function update() {


        nickScore.x = Math.floor(sprite.x - sprite.width / 2);
        nickScore.y = Math.floor(sprite.y - sprite.height);
        nickScore.bringToTop();

        game.physics.arcade.collide(sprite, platforms);



        //    game.physics.arcade.collide(bullets, platforms);
        //    game.physics.arcade.collide(bullets, bullets);

        game.physics.arcade.overlap(bullets, platforms, bulletHitEnemy, null, this);

        sprite.rotation = game.physics.arcade.angleToPointer(sprite);

        for (var i = 0; i < enemies.length; i++) {
            currentId = enemies[i].id;
            enemies[i].nickScore.x = Math.floor(enemies[i].enemy.x - enemies[i].enemy.width / 2);
            enemies[i].nickScore.y = Math.floor(enemies[i].enemy.y - enemies[i].enemy.height);
            game.physics.arcade.overlap(bullets, enemies[i].enemy, bulletHitToKill, null, this);
            game.physics.arcade.overlap(sprite, enemies[i].enemyBullets, bulletHitOur, null, this);
            game.physics.arcade.overlap(enemies[i].enemyBullets, platforms, platformKillBullet, null, this);
            for (var j = 0; j < enemies.length; j++) {
                if (i != j) game.physics.arcade.overlap(enemies[j].enemy, enemies[i].enemyBullets, enemyEnemyCollision, null, this);
            }
            game.physics.arcade.collide(enemies[i].enemy, platforms);

        }

        if (game.input.activePointer.isDown) {
            fire();
        }

        //game.physics.arcade.collide(sprite, platforms);

        sprite.body.velocity.x = 0;

        if (game.input.keyboard.isDown(Phaser.Keyboard.A)) {
            sprite.body.velocity.x = -250;
            socket.emit('updateVelX', sId, -250);
        } else if (game.input.keyboard.isDown(Phaser.Keyboard.D)) {
            sprite.body.velocity.x = 250;
            socket.emit('updateVelX', sId, 250);
        }

        if (game.input.keyboard.isDown(Phaser.Keyboard.W) && (sprite.body.onFloor() || sprite.body.touching.down)) {
            sprite.body.velocity.y = -400;
            socket.emit('updateVelY', sId, -400);
        }
        if (sprite.body.velocity.x == 0) {
            socket.emit('updateVelX', sId, 0);
        }
    }

    function fire() {

        if (game.time.now > nextFire && bullets.countDead() > 0) {
            nextFire = game.time.now + fireRate;

            var bullet = bullets.getFirstDead();

            bullet.reset(sprite.x - 8, sprite.y - 8);

            var mouseX = game.input.mousePointer.x;
            var mouseY = game.input.mousePointer.y;
            socket.emit('updatePos', sId, sprite.x, sprite.y);
            socket.emit('fireDaBullet', mouseX, mouseY, sId);

            console.log(mouseX + " " + mouseY + " " + sprite.x + " " + sprite.y);

            game.physics.arcade.moveToPointer(bullet, 500);
        }

    }

    function fireEnemyBullet() {

        if (game.time.now > nextFire && bullets.countDead() > 0) {
            nextFire = game.time.now + fireRate;

            var bullet = bullets.getFirstDead();

            bullet.reset(sprite.x - 8, sprite.y - 8);

            game.physics.arcade.moveToPointer(bullet, 500);
        }

    }

    function bulletHitEnemy(bullet, playform) {

        bullet.kill();
    }

    function platformKillBullet(bullet, platform) {
        bullet.kill();
    }

    function bulletHitOur(sprite, bullet) {
        bullet.kill();
        socket.emit('hitted', sId);
        var dead = hitOurSprite();
        if (dead) {
            var x = game.world.randomX;
            var y = game.world.randomY;

            sprite.reset(x, y);
            spriteHp = 3;


            socket.emit('resetMe', sId, sprite.x, sprite.y, currentId);
        }
    }

    function hitOurSprite() {
        spriteHp -= 1;
        console.log("updating" + this.spriteHp);


        if (spriteHp <= 0) {
            sprite.kill();
            return true;
        }

        return false;
    }

    function enemyEnemyCollision(enemy, bullet) {
        bullet.kill();
    }

    function bulletHitToKill(enemy, bullet) {

        bullet.kill();
        var dead = enemies[enemy.name].hit();
        if (dead) {
            enemies[enemy.name].health = 3;
        }

    }

    function render() {

        game.debug.text('Active Bullets: ' + bullets.countLiving() + ' / ' + bullets.total, 32, 32);
        game.debug.spriteInfo(sprite, 32, 450);

    }

});