const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {
    @property(cc.Node)
    node1: cc.Node = null; // Node to spin

    @property(cc.Node)
    node2: cc.Node = null; // Node to click on

    @property(cc.AudioClip)
    spin: cc.AudioClip = null;
    @property(cc.AudioClip)
    bgSound: cc.AudioClip = null;
    @property(cc.AudioClip)
    bigWin: cc.AudioClip = null;

    @property(cc.Animation)
    spinWin: cc.Animation = null;

    isSpinning: boolean = false;
    spinDuration: number = 2;

    onLoad() {
        this.node2.on(cc.Node.EventType.TOUCH_END, this.startSpin.bind(this));
        cc.audioEngine.playMusic(this.bgSound, true);
    }

    startSpin() {
        cc.audioEngine.playMusic(this.spin, true);
        if (!this.isSpinning) {
        this.node2.interactable = false;
        this.isSpinning = true;
            this.node1.runAction(
                cc.sequence(
                    cc.rotateBy(this.spinDuration, 360 * (this.spinDuration*2.5)),
                    cc.callFunc(this.stopSpin.bind(this))
                )
            );
        }
    }
    delayTime() {
      var delayAction = cc.delayTime(1);
      var callFunc = cc.callFunc(function() {
        cc.delayTime(1);
        cc.director.loadScene('Game');
      });
      
      var sequence = cc.sequence(delayAction, callFunc);
      this.node.runAction(sequence);
    }
    stopSpin() {
        this.isSpinning = false;
        cc.audioEngine.stopAll();
        this.spinWin.play("spinWinAlert");
        cc.audioEngine.playMusic(this.bigWin, true);
        this.delayTime();
        cc.audioEngine.playMusic(this.bigWin, false);
    }
    
    quitBtn() {
        cc.game.end();
    }
}