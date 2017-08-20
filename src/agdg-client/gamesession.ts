/// <reference path="assetcache.ts"/>
/// <reference path="realmprotocol-generated.ts"/>

module agdg {
    export class GameSession {
        chat: Chat;
        world: World;

        ws: WebSocket;

        protocol: RealmProtocol.RealmProtocol;
        statusBar: JQuery;

        clientVersion: number = 1;

        loadingScreen: LoadingScreen = new LoadingScreen();

        constructor() {
            this.statusBar = $('#status-bar');
        }

        connect(realmUrl: string, token: string) {
            //this.setState(LoginState.connecting, this.loginServerUrl);
            this.ws = new WebSocket(realmUrl);
            this.ws.binaryType = 'arraybuffer';

            this.ws.onopen = event => {
                this.protocol = new RealmProtocol.RealmProtocol(this.ws);
                this.protocol.sendCHello(token, 0);

                this.statusBar.hide();
            };

            this.ws.onmessage = event => {
                // TODO: state machine etc.

                //console.log(event.data, event.data.byteLength);

                var dv = new DataView(event.data);
                //console.log(dv.getUint8(0));

                // parse commands
                for (var offset = 0; offset < event.data.byteLength; offset++) {
                    var code = dv.getUint8(offset + 0);
                    var cookie = dv.getUint8(offset + 1);
                    var payloadLength = dv.getUint16(offset + 2);

                    //console.log('command', code, cookie, payloadLength, offset + 4);
                    this.handleCommand(dv, code, cookie, offset + 4);

                    offset += 4 + payloadLength;
                }
            }

            this.ws.onclose = event => {
            }
        }

        handleCommand(dv: DataView, code: number, cookie: number, offset: number) {
            switch (code) {
                case 1:     // kSHello
                    var data = this.protocol.decodeSHello(dv, offset);
                    this.protocol.sendCEnterWorld(data.characters[0], 0);
                    break;

                case 2:     // kSLoadZone
                    var data = this.protocol.decodeSLoadZone(dv, offset);

                    this.loadingScreen.show('Loading Zone Data');
                    g_assetCache.getOrDownloadAssetJSON(data.zoneRef, (zoneData) => {
                        console.log('zone data loaded');
                        this.onZoneDataLoaded(zoneData);
                    },
                    (error) => {
                    });
                    break;

                case 3:     // kSZoneState
                    var data = this.protocol.decodeSZoneState(dv, offset);
                    console.log(data);

                    for (var index in data.entities) {
                        var e = data.entities[index];
                        this.world.spawnPlayerEntity(e.eid, e.name, e.pos, e.dir);
                    }

                    this.world.spawnPlayer(data.playerEid, data.playerName, data.playerPos, data.playerDir);
                    break;

                case 4:     // kSPing
                    this.protocol.sendCPong(cookie);
                    break;

                case 20:    // kSEntitySpawn
                    var data = this.protocol.decodeSEntitySpawn(dv, offset);
                    var e = data.entity;

                    this.world.spawnPlayerEntity(e.eid, e.name, e.pos, e.dir);
                    break;

                case 21:    // kSEntityDespawn
                    var data = this.protocol.decodeSEntityDespawn(dv, offset);
                    this.world.despawnEntity(data.eid);
                    break;

                case 22:    // kSEntityUpdate
                    var data = this.protocol.decodeSEntityUpdate(dv, offset);
                    var ent = this.world.getEntityByEid(data.eid);

                    if (ent)
                        ent.updateInterpPosDir(data.pos, data.dir);
                    break;

                case 30:    // kSChatSay
                    var data = this.protocol.decodeSChatSay(dv, offset);

                    if (data.eid) {
                        var ent = this.world.getEntityByEid(data.eid);

                        if (ent)
                            this.chat.showMessage(ent, data.text, data.html);
                        else
                            console.log("Error: failed to find eid=" + data.eid);
                    }
                    else {
                        this.chat.showMessage(null, data.text, data.html);
                    }
                    break;
            }
        }

        async onZoneDataLoaded(zoneData) {
            var dependencies = zoneData.dependencies;

            console.log('deps', dependencies);

            // sequentially load all dependencies
            for (const dep of dependencies) {
                await g_assetCache.getOrDownloadAsset2(dep);
            }

            this.zoneReady(zoneData);
        }

        updatePlayer(pos: BABYLON.Vector3, dir: BABYLON.Vector3) {
            this.protocol.sendCPlayerMovement(pos, dir, 0);
        }

        say(message: string) {
            this.protocol.sendCChatSay(message, 0);
        }

        zoneReady(zoneData) {
            console.log(zoneData);
            this.world.onZoneLoaded(zoneData);

            this.protocol.sendCZoneLoaded(0);

            this.loadingScreen.hide();
        }
    }
}
