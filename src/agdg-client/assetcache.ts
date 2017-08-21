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

        async getOrDownloadAssetJSON2(hash: string) {
            const text = await this.getOrDownloadAssetAsText(hash);

            return JSON.parse(text);
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

        // Apply overlay and call callback. After callback resolves, overlay is torn down
        async withOverlay(hash: string, callback: (paths: string[]) => Promise<void>) {
            const overlay = await this.getOrDownloadAssetJSON2(hash);

            // Prepare data URLs in advance.
            // TODO this is dumb and wasteful. better workaround is needed.
            const dataUrls = {};
            for (const path in overlay) {
                dataUrls[path] = await this.getOrDownloadAssetAsDataURL(overlay[path]);
            }

            const createTextureOriginal = g_engine.createTexture;
            const loadFileOriginal = window['BABYLON'].Tools.LoadFile;
            //const loadImageOriginal = window['BABYLON'].Tools.LoadImage;

            window['BABYLON'].Tools.LoadFile = (url: string,
                                                callback: (data: any) => void,
                                                progressCallBack?: (data: any) => void,
                                                database?,
                                                useArrayBuffer?: boolean,
                                                onError?: (request: XMLHttpRequest) => void) => {
                console.log('withMicroOverlay Tools.LoadFile', url);

                if (url in overlay)
                    this.getOrDownloadAssetAsText(overlay[url]).then(callback);
                else
                    loadFileOriginal(url, callback, progressCallBack, database, useArrayBuffer, onError);
            };

            g_engine.createTexture = (urlArg: string,
                                      noMipmap: boolean,
                                      invertY: boolean,
                                      scene: BABYLON.Scene,
                                      samplingMode: number = BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
                                      onLoad: () => void = null,
                                      onError: () => void = null,
                                      buffer: ArrayBuffer | HTMLImageElement = null,
                                      fallBack?: WebGLTexture,
                                      format?: number): WebGLTexture => {
                console.log('withMicroOverlay Engine.createTexture', urlArg);

                if (urlArg in dataUrls) {
                    return createTextureOriginal.call(g_engine, dataUrls[urlArg].replace('application/octet-stream', 'image/png'), noMipmap, invertY, scene, samplingMode, onLoad, onError, buffer, fallBack, format);
                }
                else
                    return createTextureOriginal.call(g_engine, urlArg, noMipmap, invertY, scene, samplingMode, onLoad, onError, buffer, fallBack, format);
            };

            /*window['BABYLON'].Tools.LoadImage = (url: any, onload, onerror, database): HTMLImageElement => {
                console.log('Tools.LoadImage', url, Object.keys(dataUrls), url in dataUrls);

                if (url in dataUrls) {
                    console.log(dataUrls[url]);
                    return loadImageOriginal(dataUrls[url], onload, onerror, database);
                }
                else
                    return loadImageOriginal(url, onload, onerror, database);
            };*/

            await callback(Object.keys(overlay));

            g_engine.createTexture = createTextureOriginal;
            window['BABYLON'].Tools.LoadFile = loadFileOriginal;
            //window['BABYLON'].Tools.LoadImage = loadImageOriginal;
        }
    }

    export var g_assetCache = new AssetCache();
}
