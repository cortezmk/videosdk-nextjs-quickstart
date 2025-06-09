"use strict";
// DO NOT import anything here! The SDK provides VideoProcessor and registerProcessor as globals.
class ShareVideoProcessor extends VideoProcessor {
    constructor(port, options) {
        super(port, options);
        this.context = null;
        this.sharedVideoFrame = null;
        this.sharedVideoCanvas = null;
        port.addEventListener('message', (e) => {
            if (e.data.cmd === 'update_user_name') {
                this.userName = e.data.userName;
            }
            if (e.data.cmd === 'update_shared_video_data') {
                this.updateSharedVideoCanvas(e.data.data, e.data.width, e.data.height);
            }
        });
    }
    async processFrame(input, output) {
        this.port.postMessage({
            cmd: 'request_next_frame'
        });
        this.renderFrame(input, output);
        return true;
    }
    onInit() {
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
    updateSharedVideoCanvas(data, width, height) {
        if(!data) {
            this.sharedVideoCanvas = null;
            return;
        }
        const tempCanvas = new OffscreenCanvas(width, height);
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.imageSmoothingQuality = 'high';
        const imageData = new ImageData(data, width, height);
        tempCtx.putImageData(imageData, 0, 0);
        this.sharedVideoCanvas = tempCanvas;
    }
    renderFrame(input, output) {
        const context = output.getContext('2d');
        if (!context)
            return;
        context.imageSmoothingQuality = 'high';
        if (this.sharedVideoCanvas) {
            output.width = this.sharedVideoCanvas.width;
            output.height = this.sharedVideoCanvas.height;
            context.drawImage(this.sharedVideoCanvas, 0, 0, this.sharedVideoCanvas.width, this.sharedVideoCanvas.height);
            context.drawImage(input, 0, 0, output.width / 5, output.height / 5);
        } else {
            context.drawImage(input, 0, 0, output.width, output.height);
        }
        if(this.userName) {
            context.font = '32px Arial';
            context.fillStyle = 'white';
            context.fillText(this.userName, 10, output.height - 16);
        }
    }
}
registerProcessor('share-video-processor', ShareVideoProcessor);
