/// <reference path="assetcache.ts"/>
/// <reference path="realm-protocol-generated.ts"/>

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
            var self = this;

            this.statusBar = $('#status-bar');
        }

        connect(realmUrl: string, token: string) {
            var self = this;

            //this.setState(LoginState.connecting, this.loginServerUrl);
            this.ws = new WebSocket(realmUrl);
            this.ws.binaryType = 'arraybuffer';

            this.ws.onopen = function (event) {
                self.protocol = new RealmProtocol.RealmProtocol(self.ws);
                self.protocol.sendCHello(token);

                /*self.setState(LoginState.negotiating);

                self.ws.send(JSON.stringify({ clientVersion: self.clientVersion }));*/

                self.statusBar.hide();
            };

            this.ws.onmessage = function (event) {
                // TODO: state machine etc.

                var dv = new DataView(event.data);
                //console.log(dv.getUint8(0));

                switch (dv.getUint8(0)) {
                    case 1:     // kSHello
                        var data = self.protocol.decodeSHello(dv);
                        self.protocol.sendCEnterWorld(data.characters[0]);   // FIXME
                        break;

                    case 2:     // kSLoadZone
                        var data = self.protocol.decodeSLoadZone(dv);

                        self.loadingScreen.show('Loading Zone Data');
                        g_assetCache.getOrDownloadAssetJSON(data.zoneRef, (zoneData) => {
                            console.log('zone data loaded');
                            self.onZoneDataLoaded(zoneData);
                        },
                        (error) => {
                        });
                        break;

                    case 3:     // kSZoneState
                        var data = self.protocol.decodeSZoneState(dv);
                        console.log(data);

                        for (var index in data.entities) {
                            var e = data.entities[index];
                            self.world.spawnPlayerEntity(e.eid, e.name, e.pos, e.dir);
                        }

                        self.world.spawnPlayer(data.playerEid, data.playerName, data.playerPos, data.playerDir);
                        break;

                    case 4:     // kSPing
                        self.protocol.sendCPong();
                        break;

                    case 20:    // kSEntitySpawn
                        var data = self.protocol.decodeSEntitySpawn(dv);
                        var e = data.entity;

                        self.world.spawnPlayerEntity(e.eid, e.name, e.pos, e.dir);
                        break;

                    case 21:    // kSEntityDespawn
                        var data = self.protocol.decodeSEntityDespawn(dv);
                        self.world.despawnEntity(data.eid);
                        break;

                    case 22:    // kSEntityUpdate
                        var data = self.protocol.decodeSEntityUpdate(dv);
                        var ent = self.world.getEntityByEid(data.eid);

                        if (ent)
                            ent.updateInterpPosDir(data.pos, data.dir);
                        break;

                    case 30:    // kSChatSay
                        var data = self.protocol.decodeSChatSay(dv);

                        if (data.eid) {
                            var ent = self.world.getEntityByEid(data.eid);

                            if (ent)
                                self.chat.showMessage(ent, data.text, data.html);
                            else
                                console.log("Error: failed to find eid=" + data.eid);
                        }
                        else {
                            self.chat.showMessage(null, data.text, data.html);
                        }
                        break;
                }
            }

            this.ws.onclose = function (event) {
                /*if (self.state == LoginState.connecting)
                    self.setState(LoginState.failedToConnect);
                else
                    self.setState(LoginState.disconnected);*/
            }
        }

        onZoneDataLoaded(zoneData) {
            var dependencies = zoneData.dependencies;

            console.log('deps', dependencies);

            if (!dependencies.length)
                return this.zoneReady(zoneData);
        }

        updatePlayer(pos: pc.Vec3, dir: pc.Vec3) {
            this.protocol.sendCPlayerMovement(pos, dir);
        }

        say(message: string) {
            this.protocol.sendCChatSay(message);
        }

        zoneReady(zoneData) {
            console.log(zoneData);
            this.world.onZoneLoaded(zoneData);

            this.protocol.sendCZoneLoaded();

            this.loadingScreen.hide();
        }
    }
}
