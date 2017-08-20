module agdg {
    export class AssetCache {
        db: IDBDatabase;

        constructor() {
            var self = this;
            var request = window.indexedDB.open('agdg-cache');

            request.onerror = function (event) {
                window.alert('Fatal error: failed to open asset cache');
            };

            request.onsuccess = function (event) {
                self.db = request.result;
            };

            request.onupgradeneeded = function (event) {
                var target: any = event.target;
                var db = target.result;

                db.createObjectStore("assets");
            };
        }

        getOrDownloadAsset(hash: string, callback: (data: Blob) => void, failCallback: (error) => void) {
            var self = this;
            var request = this.db.transaction("assets").objectStore("assets").get(hash);

            request.onerror = function (event) {
                failCallback(event.type);
            };

            request.onsuccess = function (event: any) {
                if (event.target.result) {
                    console.log('retrieved', hash, event.target.result);
                    callback(event.target.result);
                }
                else {
                    console.log('downloading', hash);
                    self.downloadAsset(hash, callback, failCallback);
                }
            };
        }

        getOrDownloadAsset2(hash: string): Promise<Blob> {
            return new Promise((resolve, reject) => {
                const request = this.db.transaction("assets").objectStore("assets").get(hash);

                request.onerror = (event) => {
                    reject(event.type);
                };

                request.onsuccess = (event: any) => {
                    if (event.target.result) {
                        console.log('retrieved', hash, event.target.result);
                        resolve(event.target.result);
                    }
                    else {
                        console.log('downloading', hash);
                        this.downloadAsset(hash, resolve, reject);
                    }
                };
            });
        }

        async getOrDownloadAssetAsDataURL(hash: string): Promise<string> {
            const blob = await this.getOrDownloadAsset2(hash);

            // basically `return await reader.readAsDataURL`
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => resolve(reader.result);
            });
        }

        async getOrDownloadAssetAsText(hash: string): Promise<string> {
            const blob = await this.getOrDownloadAsset2(hash);

            // basically `return await reader.readAsText`
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsText(blob);
                reader.onloadend = () => resolve(reader.result);
            });
        }

        getOrDownloadAssetJSON(hash: string, callback: (data: Object) => void, failCallback: (error) => void) {
            return this.getOrDownloadAsset(hash, (blob: Blob) => {
                console.log('parsing JSON');
                var reader = new FileReader();
                reader.readAsText(blob);

                reader.onload = () => callback(JSON.parse(reader.result));
                reader.onerror = (e) => console.log(e);
            }, failCallback);
        }

        downloadAsset(hash: string, callback: (data: Blob) => void, failCallback: (error) => void) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'content/' + hash, true);
            xhr.responseType = 'blob';

            xhr.onload = (e) => {
                if (xhr.status == 200) {
                    const blob = xhr.response;
                    console.log('downloaded', hash);
                    this.putAsset(hash, blob);
                    callback(blob);
                }
            };

            xhr.onerror = (e) => {
                const target: any = e.target;
                failCallback(target.statusText);
            }

            xhr.send();
        }

        putAsset(hash: string, value: any) {
            var self = this;
            var request = this.db.transaction("assets", 'readwrite').objectStore("assets").put(value, hash);

            request.onsuccess = function (event: any) {
                console.log('successfully stored blob', hash);
            };
        }
    }

    export var g_assetCache = new AssetCache();
}
