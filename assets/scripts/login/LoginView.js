cc.Class({
    extends: cc.Component,

    properties: {
        menuNode: {
            default: null,
            type: cc.Node,
        },
        labelTips: {
            default: null,
            type: cc.Label,
        },
    },

    onLoad: function () {
        this.menuNode.active = true;
        // this.checkVersion();
        // this.labelTips.string = 'loading resources, please wait';
    },

    onDestroy: function () {

    },

    onEnable: function() {
        cc.director.on('HotUpdateFinish',this.onHotUpdateFinish, this);
        cc.director.on('HotUpdateRate', this.onHotUpdateRate, this);
    },

    onDisable: function() {
        cc.director.off('HotUpdateFinish',this.onHotUpdateFinish, this);
        cc.director.off('HotUpdateRate', this.onHotUpdateRate, this);
    },

    //检查版本更新
    checkVersion: function() {
        // gg.fun.showLoading('正在更新游戏资源');
        // var hotUpdateModule = this.node.getComponent('HotUpdateModule');
        // hotUpdateModule.checkUpdate();
    },

    //更新完成
    onUpdateFinish: function () {
        this.menuNode.active = true;
        this.labelTips.string = '';
    },

    //热更新结束
    onHotUpdateFinish: function (param) {
        let result = param;
        if (result) {
            this.onUpdateFinish();
        } else {
            this.onUpdateFinish();
        }
    },

    //热更进度
    onHotUpdateRate: function (param) {
        let percent = param;
        if (percent > 1) {
            percent = 1;
        }

        this._updatePercent = percent;
        this.labelTips.string = 'ĐANG TIẾN HÀNH CẬP NHẬT TÀI NGUYÊN GAME, TIẾN ĐỘ CẬP NHẬT '+ parseInt(percent * 10000)/100+'%';
    },

    onBtnStartGame: function () {
        cc.director.loadScene('Game');
    },

    onBtnBill: function () {
        cc.director.loadScene('Game');
    },
});
