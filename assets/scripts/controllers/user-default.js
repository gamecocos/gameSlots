var UserDefaultKeys=require('user-default-keys')()
var UserDefault=cc.Class({
    extends: cc.Component,

    properties: {
        localStorage:{
            default:null,
            visible:false,
            type:Object
        }
    },
    onLoad: function () {
        this.localStorage=cc.sys.localStorage;
        UserDefault.instance = this;
    },
    statics: {
        instance: null
    },
    setCurrentCredit(value){
        this.localStorage.setItem(UserDefaultKeys.CURRENT_CREDIT,value);
    },
    getCurrentCredit(defaultValue){
        var data=this.localStorage.getItem(UserDefaultKeys.CURRENT_CREDIT);
        if (!data){
            data=defaultValue;   
        }
        return data ? parseInt(data) :0 ;
    },
});
