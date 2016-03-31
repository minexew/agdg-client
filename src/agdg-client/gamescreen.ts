/// <reference path="worldentity.ts"/>
/// <reference path="../jquery.ts"/>

module agdg {
    export var g_camera: pc.CameraComponent;

    export class Chat {
        chatBox: JQuery;
        chatMsg: JQuery;
        chatMessages: JQuery;

        session: GameSession;

        constructor(session: GameSession) {
            this.chatBox = $('#chat-box');
            this.chatMsg = $('#chat-msg');
            this.chatMessages = $('#chat-messages');
            this.session = session;

            this.chatBox.show();

            //$('#chat-send').click(() => {
            this.chatMsg.on('keypress', (e) => {
                if (!e) e = window.event;
                var keyCode = e.keyCode || e.which;
                if (keyCode == '13') {
                    this.session.say(this.chatMsg.val());
                    this.chatMsg.val('');
                    $('#application-canvas').focus();
                    return false;
                }
            });
        }

        showMessage(entity: pc.Entity, message: string, html: boolean) {
            var entityMap = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': '&quot;', "'": '&#39;', "/": '&#x2F;'};

            function escapeHtml(string) {
                return String(string).replace(/[&<>"'\/]/g, function (s) {
                    return entityMap[s];
                });
            }

            var green = (message.charAt(0) == '>');

            if (!html)
                message = escapeHtml(message);

            if (green)
                message = '<span style="color: #99cc33">' + message + '</span>';
            else
                message = '<span>' + message + '</span>';

            var messageHtml = $(message);
            var messageDiv = $('<div>');

            var dlgReply = messageHtml.find('.dlg-reply');

            if (dlgReply.length) {
                dlgReply.click((e) => this.session.say($(e.target).text()));
                messageDiv.append('&gt; ');
            }
            else if (entity)
                messageDiv.append('<b>' + entity.getName() + '</b>&gt; ');

            messageDiv.append(messageHtml);

            this.chatMessages.append(messageDiv);
            this.chatMessages.scrollTop(this.chatMessages[0].scrollHeight);
        }
    }

    export class Player {
        playerEntity: agdg.Entity;
        session: GameSession;

        moving: boolean = false;
        forceSync: boolean = false;
        requestedVelocity: pc.Vec3 = pc.Vec3.ZERO.clone();
        framesWithoutSync: number = 0;

        constructor(playerEntity: agdg.Entity, session: GameSession) {
            this.playerEntity = playerEntity;
            this.session = session;
        };

        handleInput() {
            if (app.keyboard.wasPressed(pc.KEY_LEFT))
                this.startMoving(-1, 0);
            else if (app.keyboard.wasReleased(pc.KEY_LEFT))
                this.stopMoving(-1, 0);

            if (app.keyboard.wasPressed(pc.KEY_RIGHT))
                this.startMoving(1, 0);
            else if (app.keyboard.wasReleased(pc.KEY_RIGHT))
                this.stopMoving(1, 0);

            if (app.keyboard.wasPressed(pc.KEY_UP))
                this.startMoving(0, 1);
            else if (app.keyboard.wasReleased(pc.KEY_UP))
                this.stopMoving(0, 1);

            if (app.keyboard.wasPressed(pc.KEY_DOWN))
                this.startMoving(0, -1);
            else if (app.keyboard.wasReleased(pc.KEY_DOWN))
                this.stopMoving(0, -1);
        }

        startMoving(xvel: number, yvel: number) {
            this.requestedVelocity.add(new pc.Vec3(xvel, yvel, 0));
            this.moving = (this.requestedVelocity.length() > 0.001);
            
            if (this.moving)
                this.playerEntity.velocity = this.requestedVelocity.clone().normalize().scale(0.05);
            else
                this.playerEntity.velocity = pc.Vec3.ZERO;

            this.forceSync = true;
        }

        stopMoving(xvel: number, yvel: number) {
            this.startMoving(-xvel, -yvel);
        }

        update() {
            if (this.moving) {
                if (this.forceSync || ++this.framesWithoutSync >= 3) {
                    this.session.updatePlayer(this.playerEntity.getPosition(), pc.Vec3.ZERO);
                    this.framesWithoutSync = 0;
                    this.forceSync = false;
                }
            }
        }
    }

    export class World {
        app: pc.Application;
        root: pc.Entity;
        session: GameSession;

        entities: Array<agdg.Entity>;
        nextEid: number;

        playerEntity: agdg.Entity;
        player: Player;

        constructor(app: pc.Application, root: pc.Entity, session: GameSession) {
            this.app = app;
            this.root = root;
            this.session = session;

            this.entities = [];
            this.nextEid = -1;
        }

        despawnEntity(eid: number) {
            // FIXME: validate eid
            this.entities[eid].destroy();
            delete this.entities[eid];
        }

        getEntityByEid(eid: number) {
            return this.entities[eid];
        }

        spawnEntities(entitiesToSpawn) {
            for (var e in entitiesToSpawn) {
                this.spawnEntityFromDesc(this.nextEid, entitiesToSpawn[e]);
                this.nextEid--;
            }
        }

        spawnEntity(eid: number, entity: agdg.Entity) {
            this.root.addChild(entity);
            this.entities[eid] = entity;
        }

        spawnEntityFromDesc(eid: number, desc) {
            var entity = new agdg.Entity();

            switch (desc.type) {
                case 'box':
                    entity.addComponent("model", {
                        type: "box",
                        castShadows: true,
                    });
                    break;

                /*case 'cone':
                    entity.addComponent("model", {
                        type: "cone",
                        castShadows: true,
                    });
                    entity.setEulerAngles(90, 0, 0);
                    break;*/

                case 'light':
                    if (desc.options.color)
                        desc.options.color = new pc.Color(desc.options.color[0], desc.options.color[1], desc.options.color[2]);

                    entity.addComponent("light", desc.options);
                    entity.setEulerAngles(90, 0, 0);
                    break;
            }

            if (desc.name)
                entity.setName(desc.name);

            if (desc.pos)
                entity.setPosition(new pc.Vec3(desc.pos[0], desc.pos[1], desc.pos[2]));

            if (desc.scale)
                entity.setLocalScale(desc.scale[0], desc.scale[1], desc.scale[2]);

            this.root.addChild(entity);
            this.entities[eid] = entity;
        }

        spawnPlayerEntity(eid: number, name: string, pos: pc.Vec3, dir: pc.Vec3): agdg.Entity {
            var entity = new agdg.Entity();
            entity.addComponent("model", {
                type: 'cone',
            });
            entity.setPosition(pos);
            entity.setName(name);

            entity.setEulerAngles(90, 0, 0);

            this.spawnEntity(eid, entity);
            return entity;
        }

        onZoneLoaded(zoneData) {
            var app = this.app;
            var self = this;
            // Create box entity
            /*var cube = new pc.Entity();
            cube.addComponent("model", {
                type: "capsule",
                castShadows: true
            });*/

            // Create camera entity
            var camera = new pc.Entity();
            g_camera = camera.addComponent("camera", {
                clearColor: new pc.Color(zoneData.bgColor[0], zoneData.bgColor[1], zoneData.bgColor[2])
            });

            // Create directional light entity
            /*var light = new pc.Entity();
            light.addComponent("light", {
                type: "spot",
                color: new pc.Color(0.7, 0.3, 0.7),
                outerConeAngle: 60,
                innerConeAngle: 40,
                range: 50,
                intensity: 1,
                castShadows: true,
                shadowBias: 0.005,
                normalOffsetBias: 0.01,
                shadowResolution: 2048
            });*/

            this.spawnEntities(zoneData.entities);

            // Add to hierarchy
            //app.root.addChild(cube);
            app.root.addChild(camera);
            //app.root.addChild(light);

            app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.2);

            var cameraDist = 10;

            var camVec = new pc.Vec3(-1, -1, 1);
            camVec.scale(cameraDist / camVec.length());

            var camLookAt = pc.Vec3.ZERO;
            var camUp = new pc.Vec3(1, 1, 1);
            camUp.normalize();

            camera.setPosition(camVec);
            camera.lookAt(camLookAt, camUp);

            //cube.setPosition(0, 0, 1);
            
            /*light.setPosition(-3, -2, 5);
            light.setEulerAngles(90, 0, 0);*/
            
            // Register an update event
            app.on("update", function (deltaTime) {
                //cube.rotate(10 * deltaTime, 20 * deltaTime, 30 * deltaTime);

                if (self.player)
                    self.player.handleInput();

                self.updateEntities();

                if (self.playerEntity) {
                    camera.setPosition(camVec.clone().add(self.playerEntity.getPosition()));
                    self.player.update();
                }
            });

            $('#application-canvas').focus();
        }

        spawnPlayer(eid, name, pos, dir) {
            this.playerEntity = this.spawnPlayerEntity(eid, name, pos, dir);
            this.player = new Player(this.playerEntity, this.session);
        }

        updateEntities() {
            for (var eid in this.entities)
                this.entities[eid].update();
        }
    }

    export class GameScreen {
        app: pc.Application;
        world: World;

        constructor(app, world) {
            this.app = app;
            this.world = world;
        }
    }
}
