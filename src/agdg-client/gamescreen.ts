/// <reference path="worldentity.ts"/>
/// <reference path="../babylon.objFileLoader.d.ts"/>
/// <reference path="../jquery.ts"/>

module agdg {
    // TODO: get rid of these
    export var g_camera: BABYLON.WorldCamera;
    export var g_scene: BABYLON.Scene;

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

        keys = {};

        constructor(playerEntity: agdg.Entity, session: GameSession) {
            this.playerEntity = playerEntity;
            this.session = session;

            this.setUpInput();
        };

        setUpInput() {
            window.addEventListener('keydown', evt => {
                if (this.keys[evt.keyCode]) return;

                if (evt.keyCode === 38) this.startMoving(0, -1);
                else if (evt.keyCode === 40) this.startMoving(0, 1);
                else if (evt.keyCode === 37) this.startMoving(-1, 0);
                else if (evt.keyCode === 39) this.startMoving(1, 0);
                else return;

                this.keys[evt.keyCode] = true;
                evt.preventDefault();
            });

            window.addEventListener('keyup', evt => {
                if (!this.keys[evt.keyCode]) return;

                if (evt.keyCode === 38) this.stopMoving(0, -1);
                else if (evt.keyCode === 40) this.stopMoving(0, 1);
                else if (evt.keyCode === 37) this.stopMoving(-1, 0);
                else if (evt.keyCode === 39) this.stopMoving(1, 0);
                else return;

                this.keys[evt.keyCode] = false;
                evt.preventDefault();
            });
        }

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
            this.requestedVelocity.addInPlace(new BABYLON.Vector3(xvel, yvel, 0));
            this.moving = (this.requestedVelocity.length() > 0.001);
            
            if (this.moving)
                this.playerEntity.velocity = BABYLON.Vector3.Normalize(this.requestedVelocity).scale(0.05);
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

        entities: agdg.Entity[] = [];
        nextEid: number = -1;

        playerEntity: agdg.Entity;
        player: Player;

        constructor(session: GameSession, engine: BABYLON.Engine) {
            this.session = session;
            this.scene = new BABYLON.Scene(engine);
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
            this.entities[eid] = entity;
        }

        spawnEntityFromDesc(eid: number, desc) {
            var entity: agdg.Entity;

            switch (desc.type) {
                case 'box':
                    entity = new agdg.Entity(BABYLON.Mesh.CreateBox("", 1, this.scene));
                    break;

                case 'light':
                    entity = new agdg.Entity(new BABYLON.PointLight("Omni0", new BABYLON.Vector3(0, -10, -10), this.scene));
                    break;
            }

            if (desc.name)
                entity.setName(desc.name);

            if (desc.pos)
                entity.setPosition(BABYLON.Vector3.FromArray(desc.pos));

            if (desc.scale)
                entity.node.scaling = BABYLON.Vector3.FromArray(desc.scale);

            this.entities[eid] = entity;
        }

        spawnPlayerEntity(eid: number, name: string, pos: BABYLON.Vector3, dir: BABYLON.Vector3): agdg.Entity {
            var entity = new agdg.Entity(BABYLON.Mesh.CreateCylinder(name, 1, 0, 1, 12, 1, this.scene));
            entity.setPosition(pos);
            entity.setName(name);

            entity.node.rotation = new BABYLON.Vector3(Math.PI * 0.5, 0, 0);

            this.spawnEntity(eid, entity);
            return entity;
        }

        // TODO: probably don't want this to be async
        async spawnProps(props: any[]) {
            const ldr = new BABYLON.OBJFileLoader();

            for (const prop of props) {
                const modelData = await g_assetCache.getOrDownloadAssetAsText(prop.model);

                const meshes: BABYLON.Mesh[] = [];
                ldr.importMesh(null, this.scene, modelData, '', meshes, [], []);

                for (const mesh of meshes) {
                    mesh.position = BABYLON.Vector3.FromArray(prop.pos);
                    mesh.rotation = new BABYLON.Vector3(Math.PI * 0.5, 0, 0);
                    mesh.scaling = new BABYLON.Vector3(1.0/16.0, 1.0/16.0, 1.0/16.0);
                }
            }
        }

        onZoneLoaded(zoneData) {
            var scene = this.scene;
            g_scene = scene;

            // TODO: clean up this awful, awful mess
            var camera = new BABYLON.WorldCamera("", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
            camera.upVector = new BABYLON.Vector3(0, 0, 1);
            g_camera = camera;

            this.spawnEntities(zoneData.entities);
            this.spawnProps(zoneData.props);

            scene.ambientColor = BABYLON.Color3.FromArray(zoneData.bgColor);
            
            // Register an update event
            g_engine.runRenderLoop(() => {
                //cube.rotate(10 * deltaTime, 20 * deltaTime, 30 * deltaTime);

                if (this.player)
                    this.player.handleInput();

                this.updateEntities();

                if (this.playerEntity) {
                    camera.setTarget(this.playerEntity.getPosition());
                    this.player.update();
                }

                scene.render();

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
        world: World;

        constructor(world: World) {
            this.world = world;
        }
    }
}
