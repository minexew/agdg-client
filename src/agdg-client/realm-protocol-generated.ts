/// <reference path="realmprotocol.ts"/>

module RealmProtocol {
export class RealmProtocol extends RealmProtocolBase {
decodeCHello(dv: DataView) {
    var offset = 1;
    var data: any = {};
    data.token = this.decodeHash(dv, offset);
    offset += 28;
    return data;
}

sendCHello(token: string) {
    var offset = 1;
    this.dv.setUint8(0, 1);
    offset += this.encodeHash(offset, token);
    this.ws.send(this.ab.slice(0, offset));
};

decodeCEnterWorld(dv: DataView) {
    var offset = 1;
    var data: any = {};
    data.characterName = this.decodeString(dv, offset);
    offset += 4 + data.characterName.length;
    return data;
}

sendCEnterWorld(characterName: string) {
    var offset = 1;
    this.dv.setUint8(0, 2);
    offset += this.encodeString(offset, characterName);
    this.ws.send(this.ab.slice(0, offset));
};

decodeCZoneLoaded(dv: DataView) {
    var offset = 1;
    var data: any = {};
    return data;
}

sendCZoneLoaded() {
    var offset = 1;
    this.dv.setUint8(0, 3);
    this.ws.send(this.ab.slice(0, offset));
};

decodeCPlayerMovement(dv: DataView) {
    var offset = 1;
    var data: any = {};
    data.pos = new pc.Vec3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    data.dir = new pc.Vec3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    return data;
}

sendCPlayerMovement(pos: pc.Vec3, dir: pc.Vec3) {
    var offset = 1;
    this.dv.setUint8(0, 4);
    this.dv.setFloat32(offset, pos.x, true);
    this.dv.setFloat32(offset + 4, pos.y, true);
    this.dv.setFloat32(offset + 8, pos.z, true);
    offset += 12;
    this.dv.setFloat32(offset, dir.x, true);
    this.dv.setFloat32(offset + 4, dir.y, true);
    this.dv.setFloat32(offset + 8, dir.z, true);
    offset += 12;
    this.ws.send(this.ab.slice(0, offset));
};

decodeCPong(dv: DataView) {
    var offset = 1;
    var data: any = {};
    return data;
}

sendCPong() {
    var offset = 1;
    this.dv.setUint8(0, 5);
    this.ws.send(this.ab.slice(0, offset));
};

decodeCChatSay(dv: DataView) {
    var offset = 1;
    var data: any = {};
    data.text = this.decodeString(dv, offset);
    offset += 4 + data.text.length;
    return data;
}

sendCChatSay(text: string) {
    var offset = 1;
    this.dv.setUint8(0, 30);
    offset += this.encodeString(offset, text);
    this.ws.send(this.ab.slice(0, offset));
};

decodeSHello(dv: DataView) {
    var offset = 1;
    var data: any = {};
    var characters_count = dv.getUint32(offset, true);
    offset += 4;
    data.characters = [];

    for (var i = 0; i < characters_count; i++) {
        var the_characters: any;
    the_characters = this.decodeString(dv, offset);
    offset += 4 + the_characters.length;
        data.characters.push(the_characters);
    }

    return data;
}

sendSHello(characters: Array<string>) {
    var offset = 1;
    this.dv.setUint8(0, 1);
    this.dv.setUint32(offset, characters.length, true);
    offset += 4;

    for (var i = 0; i < characters.length; i++) {
    offset += this.encodeString(offset, characters[i]);
    }

    this.ws.send(this.ab.slice(0, offset));
};

decodeSLoadZone(dv: DataView) {
    var offset = 1;
    var data: any = {};
    data.zoneName = this.decodeString(dv, offset);
    offset += 4 + data.zoneName.length;
    data.zoneRef = this.decodeHash(dv, offset);
    offset += 28;
    return data;
}

sendSLoadZone(zoneName: string, zoneRef: string) {
    var offset = 1;
    this.dv.setUint8(0, 2);
    offset += this.encodeString(offset, zoneName);
    offset += this.encodeHash(offset, zoneRef);
    this.ws.send(this.ab.slice(0, offset));
};

decodeSZoneState(dv: DataView) {
    var offset = 1;
    var data: any = {};
    data.playerEid = dv.getInt32(offset, true);
    offset += 4;
    data.playerName = this.decodeString(dv, offset);
    offset += 4 + data.playerName.length;
    data.playerPos = new pc.Vec3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    data.playerDir = new pc.Vec3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    var entities_count = dv.getUint32(offset, true);
    offset += 4;
    data.entities = [];

    for (var i = 0; i < entities_count; i++) {
        var the_entities: any;
    the_entities = {};
    the_entities.eid = dv.getUint32(offset, true);
    offset += 4;
    the_entities.flags = dv.getUint32(offset, true);
    offset += 4;
    the_entities.name = this.decodeString(dv, offset);
    offset += 4 + the_entities.name.length;
    the_entities.pos = new pc.Vec3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    the_entities.dir = new pc.Vec3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
        data.entities.push(the_entities);
    }

    return data;
}

sendSZoneState(playerEid: number, playerName: string, playerPos: pc.Vec3, playerDir: pc.Vec3, entities: Array<any>) {
    var offset = 1;
    this.dv.setUint8(0, 3);
    this.dv.setInt32(offset, playerEid, true);
    offset += 4;
    offset += this.encodeString(offset, playerName);
    this.dv.setFloat32(offset, playerPos.x, true);
    this.dv.setFloat32(offset + 4, playerPos.y, true);
    this.dv.setFloat32(offset + 8, playerPos.z, true);
    offset += 12;
    this.dv.setFloat32(offset, playerDir.x, true);
    this.dv.setFloat32(offset + 4, playerDir.y, true);
    this.dv.setFloat32(offset + 8, playerDir.z, true);
    offset += 12;
    this.dv.setUint32(offset, entities.length, true);
    offset += 4;

    for (var i = 0; i < entities.length; i++) {
    this.dv.setUint32(offset, entities[i].eid, true);
    offset += 4;
    this.dv.setUint32(offset, entities[i].flags, true);
    offset += 4;
    offset += this.encodeString(offset, entities[i].name);
    this.dv.setFloat32(offset, entities[i].pos.x, true);
    this.dv.setFloat32(offset + 4, entities[i].pos.y, true);
    this.dv.setFloat32(offset + 8, entities[i].pos.z, true);
    offset += 12;
    this.dv.setFloat32(offset, entities[i].dir.x, true);
    this.dv.setFloat32(offset + 4, entities[i].dir.y, true);
    this.dv.setFloat32(offset + 8, entities[i].dir.z, true);
    offset += 12;
    }

    this.ws.send(this.ab.slice(0, offset));
};

decodeSPing(dv: DataView) {
    var offset = 1;
    var data: any = {};
    return data;
}

sendSPing() {
    var offset = 1;
    this.dv.setUint8(0, 4);
    this.ws.send(this.ab.slice(0, offset));
};

decodeSEntitySpawn(dv: DataView) {
    var offset = 1;
    var data: any = {};
    data.entity = {};
    data.entity.eid = dv.getInt32(offset, true);
    offset += 4;
    data.entity.flags = dv.getUint32(offset, true);
    offset += 4;
    data.entity.name = this.decodeString(dv, offset);
    offset += 4 + data.entity.name.length;
    data.entity.pos = new pc.Vec3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    data.entity.dir = new pc.Vec3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    return data;
}

sendSEntitySpawn(entity: any) {
    var offset = 1;
    this.dv.setUint8(0, 20);
    this.dv.setInt32(offset, entity.eid, true);
    offset += 4;
    this.dv.setUint32(offset, entity.flags, true);
    offset += 4;
    offset += this.encodeString(offset, entity.name);
    this.dv.setFloat32(offset, entity.pos.x, true);
    this.dv.setFloat32(offset + 4, entity.pos.y, true);
    this.dv.setFloat32(offset + 8, entity.pos.z, true);
    offset += 12;
    this.dv.setFloat32(offset, entity.dir.x, true);
    this.dv.setFloat32(offset + 4, entity.dir.y, true);
    this.dv.setFloat32(offset + 8, entity.dir.z, true);
    offset += 12;
    this.ws.send(this.ab.slice(0, offset));
};

decodeSEntityDespawn(dv: DataView) {
    var offset = 1;
    var data: any = {};
    data.eid = dv.getInt32(offset, true);
    offset += 4;
    return data;
}

sendSEntityDespawn(eid: number) {
    var offset = 1;
    this.dv.setUint8(0, 21);
    this.dv.setInt32(offset, eid, true);
    offset += 4;
    this.ws.send(this.ab.slice(0, offset));
};

decodeSEntityUpdate(dv: DataView) {
    var offset = 1;
    var data: any = {};
    data.eid = dv.getInt32(offset, true);
    offset += 4;
    data.pos = new pc.Vec3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    data.dir = new pc.Vec3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    data.latency = dv.getUint32(offset, true);
    offset += 4;
    return data;
}

sendSEntityUpdate(eid: number, pos: pc.Vec3, dir: pc.Vec3, latency: number) {
    var offset = 1;
    this.dv.setUint8(0, 22);
    this.dv.setInt32(offset, eid, true);
    offset += 4;
    this.dv.setFloat32(offset, pos.x, true);
    this.dv.setFloat32(offset + 4, pos.y, true);
    this.dv.setFloat32(offset + 8, pos.z, true);
    offset += 12;
    this.dv.setFloat32(offset, dir.x, true);
    this.dv.setFloat32(offset + 4, dir.y, true);
    this.dv.setFloat32(offset + 8, dir.z, true);
    offset += 12;
    this.dv.setUint32(offset, latency, true);
    offset += 4;
    this.ws.send(this.ab.slice(0, offset));
};

decodeSChatSay(dv: DataView) {
    var offset = 1;
    var data: any = {};
    data.eid = dv.getInt32(offset, true);
    offset += 4;
    data.text = this.decodeString(dv, offset);
    offset += 4 + data.text.length;
    data.html = (dv.getUint8(offset) != 0);
    offset += 4;
    return data;
}

sendSChatSay(eid: number, text: string, html: boolean) {
    var offset = 1;
    this.dv.setUint8(0, 30);
    this.dv.setInt32(offset, eid, true);
    offset += 4;
    offset += this.encodeString(offset, text);
    this.dv.setUint8(offset, html ? 1 : 0);
    offset += 4;
    this.ws.send(this.ab.slice(0, offset));
};

}
}
