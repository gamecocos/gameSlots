var HotUpdateModule = cc.Class({
    extends: cc.Component,

    properties: {
        manifestUrl: cc.Asset,
        versionLabel: {
            default: null,
            type: cc.Label,
        },

        _updating: false,
        _canRetry: false,
        _storagePath: ''
    },

    onLoad () {
        if (!cc.sys.isNative) {
            return;
        }
        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'client');

        this.versionCompareHandle = function (versionA, versionB) {
            var vA = versionA.split('.');
            var vB = versionB.split('.');
            for (var i = 0; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                } else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            }
            else {
                return 0;
            }
        };

        this._am = new jsb.AssetsManager(this.manifestUrl.nativeUrl, this._storagePath, this.versionCompareHandle);
        this._am.setVerifyCallback(function (filePath, asset) {
            return true;
        });

        if (this.versionLabel) {
            this.versionLabel.string = `src:${this._am.getLocalManifest().getVersion()}`;
        }
  
        //初始化脚本版本信息
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            //一些安卓设备不支持同时下载文件过多
            this._am.setMaxConcurrentTask(16);
        } else {
            this._am.setMaxConcurrentTask(16);
        }
    },

    onDestroy: function () {
        if (!cc.sys.isNative) {
            return;
        }
        this._am.setEventCallback(null);
        this._am = null;
    },

    showLog: function (msg) {
        cc.log('[HotUpdateModule][showLog]----' + msg);
    },

    retry: function () {
        if (!this._updating && this._canRetry) {
            this._canRetry = false;
            this._am.downloadFailedAssets();
        }
    },

    updateCallback: function (event) {
        var needRestart = false;
        var failed = false;
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.showLog("The local manifest file was not found, and the hot update was skipped.");
                failed = true;
                break;
            //更新进度
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                let percent = event.getPercent();
                if (isNaN(percent)) return;
                var msg = event.getMessage();
                this.disPatchRateEvent(percent, msg);
                this.showLog("updateCallback Update progress:" + percent + ', msg: ' + msg);
                break;

            //下载manifest文件失败，跳过热更新
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.showLog("Failed to download manifest file, skip hot update.");
                failed = true;
                break;

            //已是最新版本
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.showLog("Already the latest version.");
                failed = true;
                break;
            //更新结束
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.showLog("The update is over."+ event.getMessage());
                this.disPatchRateEvent(1);
                needRestart = true;
                break;
            //更新错误
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this.showLog("Update error."+ event.getMessage());
                this._updating = false;
                this._canRetry = true;
                this._failCount++;
                this.retry();
                break;
            //更新过程中错误
            case jsb.EventAssetsManager.ERROR_UPDATING:
                this.showLog('Error during update:' + event.getAssetId() + ', ' + event.getMessage());
                break;
            //解压错误
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.showLog('unzip error');
                break;
            default:
                break;
        }

        if (failed) {
            this._am.setEventCallback(null);
            this._updating = false;
        }
        
        if (needRestart) {
            this._am.setEventCallback(null);
            var searchPaths = jsb.fileUtils.getSearchPaths();
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            Array.prototype.unshift.apply(searchPaths, newPaths);
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);
            cc.audioEngine.stopAll();
            setTimeout(() => {
                cc.game.restart();
            }, 100);
        }
    },

    hotUpdate: function () {
        if (this._am && !this._updating) {
            this._am.setEventCallback(this.updateCallback.bind(this));
            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                var url = this.manifestUrl.nativeUrl;
                if (cc.assetManager.md5Pipe) {
                    url = cc.assetManager.md5Pipe.transformURL(url);
                }
                this._am.loadLocalManifest(url);
            }
            this._failCount = 0;
            this._am.update();
            this._updating = true;
        }
    },

   //检测更新状态
    checkCallback: function (event) {
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.showLog("The local manifest file was not found, and the hot update was skipped.");
                this.hotUpdateFinish(true);
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.showLog("Failed to download manifest file, skip hot update.");
                this.hotUpdateFinish(false);
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.showLog("updated.");
                this.hotUpdateFinish(true);
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND: {
                //有新版本
                this.showLog("There is a new version, need to update");
                this._updating = false;
                this.hotUpdate();
                return;
            }
            case jsb.EventAssetsManager.UPDATE_PROGRESSION: {
                //有新版本
                let percent = event.getPercent();
                if (isNaN(percent)) return;
                var msg = event.getMessage();
                this.showLog("checkCallback Update progress:" + percent + ', msg: ' + msg);
                return;
            }
            default:
                console.log('event.getEventCode():' + event.getEventCode());
                return;
        }
        this._am.setEventCallback(null);
        this._updating = false;
    },

    checkUpdate: function () {
        if (this._updating) {
            cc.log("Checking for updates...");
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            var url = this.manifestUrl.nativeUrl;
            if (cc.assetManager.md5Pipe) {
                url = cc.assetManager.md5Pipe.transformURL(url);
            }
            this._am.loadLocalManifest(url);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            this.showLog('Failed to load manifest file');
            return;
        }
        this._am.setEventCallback(this.checkCallback.bind(this));
        this._am.checkUpdate();
        this._updating = true;
        this.disPatchRateEvent(0.01);
    },

    //热更完成
    hotUpdateFinish: function (result) {
        cc.director.emit('HotUpdateFinish',result);
    },

    disPatchRateEvent: function (percent) {
        if (percent > 1) {
            percent = 1;
        }
        cc.director.emit('HotUpdateRate',percent);
    },
});
