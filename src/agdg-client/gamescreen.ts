/// <reference path="worldentity.ts"/>
/// <reference path="../jquery.ts"/>

module agdg {
    //export var g_camera: pc.CameraComponent;

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

        showMessage(entity: Entity, message: string, html: boolean) {
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
            else if (entity) {
                messageDiv.append('<b>' + entity.getName() + '</b>&gt; ');
                entity.showChatBubble(messageHtml);
            }

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
        requestedVelocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        framesWithoutSync: number = 0;

        constructor(playerEntity: agdg.Entity, session: GameSession) {
            this.playerEntity = playerEntity;
            this.session = session;
        };

        handleInput() {
            /*if (app.keyboard.wasPressed(pc.KEY_LEFT))
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
                this.stopMoving(0, -1);*/
        }

        startMoving(xvel: number, yvel: number) {
            this.requestedVelocity.add(new BABYLON.Vector3(xvel, yvel, 0));
            this.moving = (this.requestedVelocity.length() > 0.001);
            
            if (this.moving)
                this.playerEntity.velocity = this.requestedVelocity.clone().normalize().scale(0.05);
            else
                this.playerEntity.velocity = BABYLON.Vector3.Zero();

            this.forceSync = true;
        }

        stopMoving(xvel: number, yvel: number) {
            this.startMoving(-xvel, -yvel);
        }

        update() {
            if (this.moving) {
                if (this.forceSync || ++this.framesWithoutSync >= 3) {
                    this.session.updatePlayer(this.playerEntity.getPosition(), BABYLON.Vector3.Zero());
                    this.framesWithoutSync = 0;
                    this.forceSync = false;
                }
            }
        }
    }

    export class World {
        session: GameSession;
        scene: BABYLON.Scene;       // TODO: really, really doesn't belong here

        entities: Array<agdg.Entity>;
        nextEid: number;

        playerEntity: agdg.Entity;
        player: Player;

        constructor(session: GameSession, engine: BABYLON.Engine) {
            this.session = session;
            this.scene = new BABYLON.Scene(engine);

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
            //this.root.addChild(entity);
            this.entities[eid] = entity;
        }

        spawnEntityFromDesc(eid: number, desc) {
            var entity = new agdg.Entity();

            switch (desc.type) {
                case 'box':
                    /*entity.addComponent("model", {
                        type: "box",
                        castShadows: true,
                    });*/
                    entity.mesh = BABYLON.Mesh.CreateBox("", 1, this.scene);
                    break;

                /*case 'cone':
                    entity.addComponent("model", {
                        type: "cone",
                        castShadows: true,
                    });
                    entity.setEulerAngles(90, 0, 0);
                    break;*/

                case 'light':
                    /*if (desc.options.color)
                        desc.options.color = new BABYLON.Color3(desc.options.color[0], desc.options.color[1], desc.options.color[2]);

                    entity.addComponent("light", desc.options);
                    entity.setEulerAngles(90, 0, 0);*/

                    var light0 = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(0, -10, -10), this.scene);
                    break;
            }

            if (desc.name)
                entity.setName(desc.name);

            if (desc.pos)
                entity.setPosition(new BABYLON.Vector3(desc.pos[0], desc.pos[1], desc.pos[2]));

            if (desc.scale)
                entity.mesh.scaling = new BABYLON.Vector3(desc.scale[0], desc.scale[1], desc.scale[2]);

            //this.root.addChild(entity);
            this.entities[eid] = entity;
        }

        spawnPlayerEntity(eid: number, name: string, pos: BABYLON.Vector3, dir: BABYLON.Vector3): agdg.Entity {
            var entity = new agdg.Entity();
            //entity.addComponent("model", {
            //    type: 'cone',
            //});
            entity.mesh = BABYLON.Mesh.CreateCylinder(name, 1, 0, 1, 1, 1, this.scene);
            entity.setPosition(pos);
            entity.setName(name);

            //entity.setEulerAngles(90, 0, 0);

            this.spawnEntity(eid, entity);
            return entity;
        }

        onZoneLoaded(zoneData) {
            var scene = this.scene;

            var camera = new BABYLON.FreeCamera("", new BABYLON.Vector3(10, 10, 10), scene);
            //var camera = new BABYLON.TargetCamera("FreeCamera", BABYLON.Vector3.Zero(), scene);
            //var camera = new BABYLON.ArcRotateCamera("", 0, 0, 30, null, scene);

            this.spawnEntities(zoneData.entities);

            function color3FromJSON(c) {
                return new BABYLON.Color3(c[0], c[1], c[2]);
            }

            scene.ambientColor = color3FromJSON(zoneData.bgColor);

            var cameraDist = 10;

            var camVec = new BABYLON.Vector3(-1, -1, 1);
            camVec.scale(cameraDist / camVec.length());

            var camLookAt = BABYLON.Vector3.Zero();
            var camUp = new BABYLON.Vector3(1, 1, 1);
            camUp.normalize();

            camera.position = camVec;
            //camer
            //camera.lookAt(camLookAt, camUp);

            // Register an update event
            g_engine.runRenderLoop(() => {
                //cube.rotate(10 * deltaTime, 20 * deltaTime, 30 * deltaTime);

                scene.render();

                if (this.player)
                    this.player.handleInput();

                this.updateEntities();

                if (this.playerEntity) {
                    //camera.setTarget(this.playerEntity.mesh.position); //= camVec.add(this.playerEntity.getPosition());
                    //camera.rotation = new BABYLON.Vector3(0.0,0.0,0.0);
                    this.player.update();
                }

                this.updateEntities2D();
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

        updateEntities2D() {
            for (var eid in this.entities)
                this.entities[eid].update2D();
        }
    }

    export class GameScreen {
        //app: pc.Application;
        world: World;

        constructor(world: World) {
            //this.app = app;
            this.world = world;
        }
    }
}
