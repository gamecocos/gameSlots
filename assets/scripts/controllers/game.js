
var Reel=require('reel'),
    Sound=require('audioSound'),
    OnOffButton=require('on-off-button'),
    UserDefault=require('user-default'),
    PayTableTags=require('paytable-tags');
    
cc.Class({
    extends: cc.Component,
    properties: {
    ///  -----------------
    musicSound:[Sound],
    sfxSound:[Sound],
    musicSource:{
        default:null,
        type:cc.AudioSource
    },
    sfxSource:{
        default:null,
        type:cc.AudioSource
    },
    musicSlider:{
        default:null,
        type: cc.Slider
    },
    sfxSlider:{
        default:null,
        type: cc.Slider
    },
    setting:{
        default: null,
        type:cc.Node
    },
    stttable:{
        default: null,
        type: cc.Animation
    },
    setting1: {
        default:null,
        type: cc.Node
    },



    ///// ---------------------
        winalert: {
            default: null,
            type: cc.Animation
        },
        reels:{
            default:[],
            type:[Reel]
        },
        currentCredit:{
            default:100,
            type:cc.Integer
        },
        betOneValue:{
            default:1,
            type:cc.Integer
        },
        betMaxValue:{
            default:5,
            type:cc.Integer
        },
        spinButton:{
            default:null,
            type:OnOffButton
        },
        autoSpinButton:{
            default:null,
            type:OnOffButton
        },
        betOneButton:{
            default:null,
            type:OnOffButton
        },
        betMaxButton:{
            default:null,
            type:OnOffButton
        },
        totalBetLabel:{
            default:null,
            type:cc.Label
        },
        creditLabel:{
            default:null,
            type:cc.Label
        },
        betInfoLabel:{
            default:null,
            type:cc.Label
        },
        rollingCompletedCount:{
            default:0,
            visible:false,
            type:cc.Integer
        },
        isRollingCompleted:{
            default:true,
            visible:false
        },
        totalBetValue:{
            default:0,
            visible:false,
            type:cc.Integer
        },
        currentBetValue:{
            default:0,
            visible:false,
            type:cc.Integer
        },
        currentPayTableTag:{
            default:0,
            visible:false,
            type:cc.Integer
        },
        isAutoSpin:{
            default:false,
            visible:false
        },
        home: {
            default:null,
            type: cc.Node
        },
        autoSpinTimer:{
            default:null,
            visible:false
        }
    },
    
    onLoad: function () {
        cc.audioEngine.stopAll();
        this.PlayMusic("bg")
        this.home.on(cc.Node.EventType.TOUCH_START, this.betHome, this);
        var that = this;

        console.log("this::: " + this.spinButton );
        
        //sets the available credit.
        this.creditLabel.string=this.currentCredit.toString();
        //init bet info label
        this.betInfoLabel.string="";

        //implements the spin button on/off event
        this.spinButton.node.on('reel-spin', function (event) {
        
            if (event.isOn){
                //play the game
                that.spin();
                that.PlaySFX("spin");
            }
        });
        //implements the auto-spin button on/off event
        this.autoSpinButton.node.on('reel-auto-spin', function (event) {
            //play the game as single spin or auto-spin
            that.isAutoSpin===true ? that.isAutoSpin=false : that.isAutoSpin=true; 
            if (that.isAutoSpin){
                if (event.isOn){
                    that.spin();
                    that.PlaySFX("spin");
                }
            }else{
               clearTimeout(that.autoSpinTimer);
               that.PlaySFX("spin");
            }
        });
        //implements the bet one button on/off event
        this.betOneButton.node.on('bet-one', function (event) {
            if (event.isOn){
                //when this button is pushed down the bet max button will be reset
                that.betMaxButton.reset();
                //set bet value
                that.currentBetValue=that.betOneValue;
                that.currentPayTableTag=PayTableTags.BET_ONE;
                that.betInfoLabel.string=that.currentBetValue.toString();
                that.PlaySFX("CoinInsert");
            }
        });
        //implements the bet-max button on/off event
        this.betMaxButton.node.on('bet-max', function (event) {
            if (event.isOn){
                //when this button is pushed down the bet one button will be reset
                that.betOneButton.reset();
                //set bet value
                that.currentBetValue=that.betMaxValue;
                that.currentPayTableTag=PayTableTags.BET_MAX;
                that.betInfoLabel.string=that.currentBetValue.toString();
                //AudioManager.instance.playCoinsInsert();
                that.PlaySFX("CoinInsert");
            }//
        });
        //implements the rolling completed event of the rell.js class
        this.node.on('rolling-completed', function (event) {
            //this method counts all the completed rolling reels and evaluate the results
            //if all the rells have been finished to roll.
            that.rollingCompletedCount++;
            //AudioManager.instance.playReelStop();
            that.PlaySFX("reelStop");

            if (that.rollingCompletedCount==that.reels.length){
                that.rollingCompletedCount=0;
                //gets the line symbols tags
                var lineSymbolsTags=[];
                lineSymbolsTags=that.getLineSymbolsTag();
                //create a paytable instance and checks if the tag symbols is a winning combination
                var paytable=that.getComponent("paytable"),
                    paytableRet=paytable.isWinning(lineSymbolsTags,that.currentPayTableTag),
                    isWinning=Object.keys(paytableRet).length>0;
                    
                if (isWinning){
                    //WON!!!
                    //if won spin and auto-spin will stop the execution
                    that.isRollingCompleted=true;
                    that.isAutoSpin ? that.autoSpinButton.reset() : that.spinButton.reset();
                    that.isAutoSpin=false;
                    that.winalert.play("winalert");
                    //play sound
                    that.PlaySFX("LineWin");
                    that.PlaySFX("CoinWin");
                    that.showWinningSymbolsAndPay(paytableRet);
                }else{
                    //LOST update credit
                    that.updateCurrenCredit(that.currentCredit-that.currentBetValue);
                    that.betInfoLabel.string=(-that.currentBetValue).toString();
                    
                    if (!that.isAutoSpin){
                        //spin completed
                        that.isRollingCompleted=true;
                        that.spinButton.reset();
                    }else{
                        that.autoSpinTimer=setTimeout(function(){
                            //auto-spin completed...will restart
                            that.spin();
                        }, 1000);  
                    }
                }
                if (that.isRollingCompleted){
                    //unlocks all buttons
                    that.setButtonsLocked(false);
                    //update user default current credit
                    UserDefault.instance.setCurrentCredit(that.currentCredit);
                }
            }
        });
        
    },
    betMute:function (){
        
        //cc.audioEngine.setMusicVolume(0);
    },
    betHome:function() {
        //cc.audioEngine.stopAll();
        cc.director.loadScene("spin");
    },
    start:function(){
        this.setting1.active = false;
        //read all the user default
        this.loadUserDefault();
        this.updateCurrenCredit(this.currentCredit+20);
    },
    loadUserDefault:function(){
        //current credit
        this.updateCurrenCredit(UserDefault.instance.getCurrentCredit(this.currentCredit));
    },
    spin:function(){
        
        //checks if there is enough credit to play
        if (this.currentCredit===0){
            return;
        }
        //reset label info with current bet value
        this.betInfoLabel.string=this.currentBetValue.toString();
        
        if (this.isRollingCompleted){
            //sets total bet Label
            this.totalBetValue+=this.currentBetValue;
            this.totalBetLabel.string=this.totalBetValue.toString();
                
            if (!this.isAutoSpin){
                this.isRollingCompleted=false;
            }
            this.setButtonsLocked(true);
            this.PlaySFX("reelRoll")
            for (var i=0;i<this.reels.length;i++){
                this.reels[i].spin();
            }
        }
    },
    setButtonsLocked:function(isLocked){
        if (!this.isAutoSpin){
            this.autoSpinButton.isLocked=isLocked;    
        }
        
        this.spinButton.isLocked=isLocked;
        this.betOneButton.isLocked=isLocked;
        this.betMaxButton.isLocked=isLocked;
    },
    getLineSymbolsTag:function(){
        var lineSymbolsTags=[];
        for (var m=0;m<this.reels.length;m++){
            var stopNode=this.reels[m].getWinnerStop();
            var stopComponent=stopNode.getComponent("stop");
            lineSymbolsTags.push(stopComponent.tag);
        }
        return lineSymbolsTags;
    },
    showWinningSymbolsAndPay:function(paytableRet){
       
        var stopNode,
            stopComponent,
            winningAmount=0;

         //loop on  the winning combinations throughout the symbols index
         //note that it's possible to have one or more winning combinaiton
        for (var i=0;i<paytableRet.length;i++){
            var item=paytableRet[i];
            for (var n=0;n<item.indexes.length;n++){
                stopNode=this.reels[item.indexes[n]].getWinnerStop();
                stopComponent=stopNode.getComponent("stop");
                stopComponent.blink();
            }
            winningAmount+=parseInt(item.winningValue);
        }

        //PAY update credit
        this.updateCurrenCredit(this.currentCredit+winningAmount);
        this.betInfoLabel.string=winningAmount.toString();
    },
    updateCurrenCredit:function(value){
        this.currentCredit=value;
        this.creditLabel.string=this.currentCredit.toString();
        if (parseInt(this.currentCredit)<=0){
            this.PlaySFX('gameOver');
           // AudioManager.instance.playGameOver();
            //TODO reset credit automatically
            this.updateCurrenCredit(100);
        }
    },

    back:function() {
        this.PlaySFX("Tap");
        cc.audioEngine.stopAll();
        cc.director.loadScene("load");
    },

    PlayMusic:function(name){
        let s = this.musicSound.find(s => s.n === name)
        if(s == null){
            console.log("not found")
        }else{
            this.musicSource.clip = s.clip
            this.musicSource.play();
        }
    },

    PlaySFX:function(name){
        let s = this.sfxSound.find(s => s.n === name)
        if(s == null){
            console.log("not found")
        }else{
            this.sfxSource.clip = s.clip
            this.sfxSource.play();
        }
    },

    MusicVolume:function(){
        this.musicSource.volume=this.musicSlider.progress
         if(this.musicSource.volume == 0){
            this.musicSprite.spriteFrame = this.offMusicSpriteFrame
            this.state1 = false
        }else{
            this.musicSprite.spriteFrame = this.onMusicSpriteFrame
            this.state1 = true
        }
    },

    SFXVolume:function(){
        this.sfxSource.volume = this.sfxSlider.progress
        if(this.sfxSource.volume == 0){
            this.sfxSprite.spriteFrame = this.offSFXSpriteFrame
            this.state2 = false
        }else{
            this.sfxSprite.spriteFrame = this.onSFXSpriteFrame
            this.state2 = true
        }
    },

    Show_stt() {
        this.setting1.active = true;
        this.stttable.play("show");
        this.PlaySFX("Tap");
        // this.setting.setPosition(0,0)
    },

    Hide_stt() {
        this.stttable.play("hide");
        this.PlaySFX("Tap");
        setTimeout(() => {
            this.setting1.active = false;
            // this.setting.setPosition(80000,932.136)
        }, 1500);
    },
});
