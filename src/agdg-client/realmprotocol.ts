module RealmProtocol {
    export class RealmProtocolBase {
        ws: WebSocket;
        ab: ArrayBuffer;
        dv: DataView;

        constructor(ws: WebSocket) {
            this.ws = ws;
            this.ab = new ArrayBuffer(4096);
            this.dv = new DataView(this.ab);
        }

        decodeHash(dv: DataView, offset: number): string {
            var s = '';

            var hexChar = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

            for (var i = 0; i < 28; i++) {
                var b = dv.getUint8(offset + i);
                s += hexChar[(b >> 4) & 0x0f] + hexChar[b & 0x0f];
            }

            return s;
        }
        
        decodeString(dv: DataView, offset: number): string {
            var length = dv.getUint32(offset, true);
            var s = '';

            for (var i = 0; i < length; i++)
                s += String.fromCharCode(dv.getUint8(offset + 4 + i));

            return s;
        }

        encodeHash(offset: number, hash: string): number {
            for (var i = 0; i < 28; i++)
                this.dv.setUint8(offset + i, parseInt(hash.substring(i * 2, i * 2 + 2), 16));

            return 28;
        }

        encodeString(offset: number, str: string): number {
            this.dv.setUint32(offset, str.length, true);

            for (var i = 0; i < str.length; i++)
                this.dv.setUint8(offset + 4 + i, str.charCodeAt(i));

            return 4 + str.length;
        }
    }
}
