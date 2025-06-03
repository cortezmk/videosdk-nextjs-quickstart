"use strict";
// DO NOT import anything here! The SDK provides VideoProcessor and registerProcessor as globals.
class ShareVideoProcessor extends VideoProcessor {
    constructor(port, options) {
        super(port, options);
        this.context = null;
        this.sharedVideoFrame = null;
        // Create an image bitmap from a web image
        port.addEventListener('message', (e) => {
            if (e.data.cmd === 'update_shared_video_frame') {
                this.updateSharedVideoFrame(e.data.data);
            }
        });
    }
    async processFrame(input, output) {
        this.renderFrame(input, output);
        return true;
    }
    onInit() {
        // @ts-ignore: getOutput is provided by the SDK
        const canvas = this.getOutput();
        if (canvas) {
            this.context = canvas.getContext('2d');
            if (!this.context) {
                console.error('2D context could not be initialized.');
            }
        }
    }
    onUninit() {
        this.context = null;
    }
    updateSharedVideoFrame(bitmap) {
        this.sharedVideoFrame = bitmap;
    }
    renderFrame(input, output) {
        if (!this.context)
            return;
        if (this.sharedVideoFrame) {
            this.context.globalAlpha = 1;
            this.context.drawImage(this.sharedVideoFrame, 0, 0, output.width, output.height);
            this.context.drawImage(input, 0, 0, output.width / 5, output.height / 5);
        }
    }
}
registerProcessor('share-video-processor', ShareVideoProcessor);
