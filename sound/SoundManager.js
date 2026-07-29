// sound/SoundManager.js
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.6;
        this.loaded = true;

        this.bgmEnabled = true;
        this.bgmVolume = 0.4;
        this.bgmTimeouts = [];       // 存储所有 setTimeout id，以便停止 BGM

        this.ctx = null;
    }

    /** 获取或创建 AudioContext */
    _getContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    // ---------- 音效播放 (保持原有所有方法) ----------
    play(name) {
        if (!this.enabled) return;
        const ctx = this._getContext();
        if (!ctx) return;

        switch (name) {
            case 'move':             this._playTone(ctx, 440, 0.1, 'sine'); break;
            case 'cardPlay':         this._playTone(ctx, 660, 0.1, 'triangle'); break;
            case 'cardDiscard':      this._playNoise(ctx, 0.05); break;
            case 'workspace':        this._playTone(ctx, 520, 0.15, 'square'); break;
            case 'taskComplete':     this._playChord(ctx, [523, 659, 784], 0.2); break;
            case 'seasonChange':     this._playChord(ctx, [392, 523, 659], 0.3); break;
            case 'trackAdvance':     this._playAscending(ctx); break;
            case 'buttonClick':      this._playTone(ctx, 800, 0.02, 'sine'); break;
            case 'recruit':          this._playChord(ctx, [440, 554, 660], 0.2); break;
            case 'affection':        this._playChord(ctx, [330, 415, 494], 0.25, 'triangle'); break;
            case 'error':            this._playNoise(ctx, 0.1); break;
            case 'coin':             this._playTone(ctx, 1200, 0.05, 'sine'); break;
            case 'newRound':         this._playChord(ctx, [262, 330, 392], 0.3); break;
            case 'victory':          this._playChord(ctx, [392, 523, 659, 784], 0.5); break;
            default:                 this._playTone(ctx, 440, 0.1, 'sine');
        }
    }

    _playTone(ctx, freq, duration, type = 'sine') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(this.volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    _playChord(ctx, freqs, duration, type = 'sine') {
        freqs.forEach(freq => this._playTone(ctx, freq, duration, type));
    }

    _playNoise(ctx, duration) {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        source.connect(gain).connect(ctx.destination);
        source.start();
    }

    _playAscending(ctx) {
        [440, 523, 659].forEach((freq, i) => {
            setTimeout(() => this._playTone(ctx, freq, 0.1, 'sine'), i * 80);
        });
    }

    // ---------- 合成 BGM (20秒温暖旋律) ----------
    /**
     * 开始循环播放合成 BGM
     */
    startBgm() {
        if (!this.bgmEnabled) return;
        this.stopBgm(); // 停止旧的

        const ctx = this._getContext();
        if (!ctx) return;

        // 主音量增益节点
        const masterGain = ctx.createGain();
        masterGain.gain.value = this.bgmVolume;
        masterGain.connect(ctx.destination);

        // 定义一段约20秒的温暖旋律 (音符/和弦序列)
        // 每个元素: [频率(数组或单值), 时长(秒), 波形, 起始时间偏移(秒)]
        const melody = [
            // 前奏 - 轻柔
            [[261.63, 329.63, 392.00], 2.0, 'sine', 0],
            [[261.63], 1.0, 'triangle', 2.0],
            [[329.63, 392.00, 440.00], 2.5, 'sine', 3.0],
            [[392.00], 1.5, 'triangle', 5.5],
            // 主旋律 - 稍强
            [[349.23, 440.00, 523.25], 2.0, 'sine', 7.0],
            [[349.23, 440.00], 1.5, 'triangle', 9.0],
            [[329.63, 415.30, 493.88], 2.0, 'sine', 10.5],
            [[392.00, 493.88, 587.33], 2.5, 'sine', 12.5],
            // 过渡
            [[261.63, 329.63], 2.0, 'sine', 15.0],
            [[261.63, 392.00], 2.0, 'triangle', 17.0],
            // 结尾
            [[349.23, 440.00, 523.25], 3.0, 'sine', 19.0],
        ];

        const segmentDuration = 22.0; // 单段时长

        const playMelody = () => {
            if (!this.bgmEnabled) return;

            melody.forEach(note => {
                const [freqs, dur, type, startTime] = note;
                const noteStart = ctx.currentTime + startTime;
                // 为每个频率创建振荡器
                const freqsArray = Array.isArray(freqs) ? freqs : [freqs];
                freqsArray.forEach(freq => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, noteStart);
                    // 每个音加入淡入淡出
                    gain.gain.setValueAtTime(0, noteStart);
                    gain.gain.linearRampToValueAtTime(this.bgmVolume * 0.6, noteStart + 0.05);
                    gain.gain.setValueAtTime(this.bgmVolume * 0.6, noteStart + dur - 0.1);
                    gain.gain.linearRampToValueAtTime(0, noteStart + dur);
                    osc.connect(gain).connect(masterGain);
                    osc.start(noteStart);
                    osc.stop(noteStart + dur + 0.1);
                });
            });

            // 循环播放 (segDuration 之后)
            const loopDelay = (segmentDuration - 0.5) * 1000; // 轻微重叠
            this.bgmTimeouts.push(setTimeout(playMelody, loopDelay));
        };

        playMelody();
    }

    /** 停止合成 BGM */
    stopBgm() {
        if (this.bgmTimeouts.length > 0) {
            this.bgmTimeouts.forEach(id => clearTimeout(id));
            this.bgmTimeouts = [];
        }
    }

    /** 加载并播放外部文件 (保留兼容) */
    loadAndPlayBgm(url) { /* 可忽略 */ }

    // ---------- 音量控制 ----------
    setVolume(vol) { this.volume = Math.min(1, Math.max(0, vol)); }
    setBgmVolume(vol) {
        this.bgmVolume = Math.min(1, Math.max(0, vol));
        // 如果需要动态更新 masterGain，可在此处理 (未实现)
    }

    toggleMute() {
        this.enabled = !this.enabled;
        this.bgmEnabled = this.enabled;
        if (!this.bgmEnabled) this.stopBgm();
        else this.startBgm();
    }
}

// 全局实例
window.soundManager = new SoundManager();