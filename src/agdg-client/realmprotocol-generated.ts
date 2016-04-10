/// <reference path="realmprotocol.ts"/>

module RealmProtocol {
export class RealmProtocol extends RealmProtocolBase {
decodeCHello(dv: DataView, offset: number) {
    var data: any = {};
    data.token = this.decodeHash(dv, offset);
    offset += 28;
    return data;
}

sendCHello(token: string, cookie: number) {
    this.dv.setUint8(0, 1);
    this.dv.setUint8(1, cookie);
    var offset = 4;
    offset += this.encodeHash(offset, token);
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeCEnterWorld(dv: DataView, offset: number) {
    var data: any = {};
    data.characterName = this.decodeString(dv, offset);
    offset += 4 + data.characterName.length;
    return data;
}

sendCEnterWorld(characterName: string, cookie: number) {
    this.dv.setUint8(0, 2);
    this.dv.setUint8(1, cookie);
    var offset = 4;
    offset += this.encodeString(offset, characterName);
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeCZoneLoaded(dv: DataView, offset: number) {
    var data: any = {};
    return data;
}

sendCZoneLoaded(cookie: number) {
    this.dv.setUint8(0, 3);
    this.dv.setUint8(1, cookie);
    var offset = 4;
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeCPlayerMovement(dv: DataView, offset: number) {
    var data: any = {};
    data.pos = new BABYLON.Vector3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    data.dir = new BABYLON.Vector3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    return data;
}

sendCPlayerMovement(pos: BABYLON.Vector3, dir: BABYLON.Vector3, cookie: number) {
    this.dv.setUint8(0, 4);
    this.dv.setUint8(1, cookie);
    var offset = 4;
    this.dv.setFloat32(offset, pos.x, true);
    this.dv.setFloat32(offset + 4, pos.y, true);
    this.dv.setFloat32(offset + 8, pos.z, true);
    offset += 12;
    this.dv.setFloat32(offset, dir.x, true);
    this.dv.setFloat32(offset + 4, dir.y, true);
    this.dv.setFloat32(offset + 8, dir.z, true);
    offset += 12;
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeCPong(dv: DataView, offset: number) {
    var data: any = {};
    return data;
}

sendCPong(cookie: number) {
    this.dv.setUint8(0, 5);
    this.dv.setUint8(1, cookie);
    var offset = 4;
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeCChatSay(dv: DataView, offset: number) {
    var data: any = {};
    data.text = this.decodeString(dv, offset);
    offset += 4 + data.text.length;
    return data;
}

sendCChatSay(text: string, cookie: number) {
    this.dv.setUint8(0, 30);
    this.dv.setUint8(1, cookie);
    var offset = 4;
    offset += this.encodeString(offset, text);
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeSHello(dv: DataView, offset: number) {
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

sendSHello(characters: Array<string>, cookie: number) {
    this.dv.setUint8(0, 1);
    this.dv.setUint8(1, cookie);
    var offset = 4;
    this.dv.setUint32(offset, characters.length, true);
    offset += 4;

    for (var i = 0; i < characters.length; i++) {
    offset += this.encodeString(offset, characters[i]);
    }

    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeSLoadZone(dv: DataView, offset: number) {
    var data: any = {};
    data.zoneName = this.decodeString(dv, offset);
    offset += 4 + data.zoneName.length;
    data.zoneRef = this.decodeHash(dv, offset);
    offset += 28;
    return data;
}

sendSLoadZone(zoneName: string, zoneRef: string, cookie: number) {
    this.dv.setUint8(0, 2);
    this.dv.setUint8(1, cookie);
    var offset = 4;
    offset += this.encodeString(offset, zoneName);
    offset += this.encodeHash(offset, zoneRef);
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeSZoneState(dv: DataView, offset: number) {
    var data: any = {};
    data.playerEid = dv.getInt32(offset, true);
    offset += 4;
    data.playerName = this.decodeString(dv, offset);
    offset += 4 + data.playerName.length;
    data.playerPos = new BABYLON.Vector3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    data.playerDir = new BABYLON.Vector3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
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
    the_entities.pos = new BABYLON.Vector3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    the_entities.dir = new BABYLON.Vector3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
        data.entities.push(the_entities);
    }

    return data;
}

sendSZoneState(playerEid: number, playerName: string, playerPos: BABYLON.Vector3, playerDir: BABYLON.Vector3, entities: Array<any>, cookie: number) {
    this.dv.setUint8(0, 3);
    this.dv.setUint8(1, cookie);
    var offset = 4;
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

    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeSPing(dv: DataView, offset: number) {
    var data: any = {};
    return data;
}

sendSPing(cookie: number) {
    this.dv.setUint8(0, 4);
    this.dv.setUint8(1, cookie);
    var offset = 4;
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeSEntitySpawn(dv: DataView, offset: number) {
    var data: any = {};
    data.entity = {};
    data.entity.eid = dv.getInt32(offset, true);
    offset += 4;
    data.entity.flags = dv.getUint32(offset, true);
    offset += 4;
    data.entity.name = this.decodeString(dv, offset);
    offset += 4 + data.entity.name.length;
    data.entity.pos = new BABYLON.Vector3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    data.entity.dir = new BABYLON.Vector3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    return data;
}

sendSEntitySpawn(entity: any, cookie: number) {
    this.dv.setUint8(0, 20);
    this.dv.setUint8(1, cookie);
    var offset = 4;
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
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeSEntityDespawn(dv: DataView, offset: number) {
    var data: any = {};
    data.eid = dv.getInt32(offset, true);
    offset += 4;
    return data;
}

sendSEntityDespawn(eid: number, cookie: number) {
    this.dv.setUint8(0, 21);
    this.dv.setUint8(1, cookie);
    var offset = 4;
    this.dv.setInt32(offset, eid, true);
    offset += 4;
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeSEntityUpdate(dv: DataView, offset: number) {
    var data: any = {};
    data.eid = dv.getInt32(offset, true);
    offset += 4;
    data.pos = new BABYLON.Vector3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    data.dir = new BABYLON.Vector3(dv.getFloat32(offset, true), dv.getFloat32(offset + 4, true), dv.getFloat32(offset + 8, true));
    offset += 12;
    data.latency = dv.getUint32(offset, true);
    offset += 4;
    return data;
}

sendSEntityUpdate(eid: number, pos: BABYLON.Vector3, dir: BABYLON.Vector3, latency: number, cookie: number) {
    this.dv.setUint8(0, 22);
    this.dv.setUint8(1, cookie);
    var offset = 4;
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
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

decodeSChatSay(dv: DataView, offset: number) {
    var data: any = {};
    data.eid = dv.getInt32(offset, true);
    offset += 4;
    data.text = this.decodeString(dv, offset);
    offset += 4 + data.text.length;
    data.html = (dv.getUint8(offset) != 0);
    offset += 4;
    return data;
}

sendSChatSay(eid: number, text: string, html: boolean, cookie: number) {
    this.dv.setUint8(0, 30);
    this.dv.setUint8(1, cookie);
    var offset = 4;
    this.dv.setInt32(offset, eid, true);
    offset += 4;
    offset += this.encodeString(offset, text);
    this.dv.setUint8(offset, html ? 1 : 0);
    offset += 4;
    this.dv.setUint16(2, offset - 4, true);
    this.ws.send(this.ab.slice(0, offset));
};

}
}
