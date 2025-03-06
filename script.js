let mediaRecorder;
let recordedChunks = [];

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const status = document.getElementById('status');

startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
downloadBtn.addEventListener('click', downloadRecording);

async function startRecording() {
    try {
        const audioSource = document.getElementById('audioSource').value;
        let stream;

        status.textContent = 'Starting recording...';

        if (audioSource === 'none') {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false
            });
        } else if (audioSource === 'mic') {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false
            });
            stream.addTrack(audioStream.getAudioTracks()[0]);
        } else if (audioSource === 'system') {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    suppressLocalAudioPlayback: true
                }
            });
        }

        const video = document.getElementById('preview');
        video.srcObject = stream;
        video.muted = true;

        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
        mediaRecorder.onstop = () => {
            saveRecording();
            stream.getTracks().forEach(track => track.stop());
        };

        recordedChunks = [];
        mediaRecorder.start();

        startBtn.disabled = true;
        stopBtn.disabled = false;
        downloadBtn.disabled = true;
        status.textContent = 'Recording...';

    } catch (err) {
        status.textContent = `Error: ${err.message}`;
        console.error('Error:', err);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        status.textContent = 'Processing recording...';
    }
}

function saveRecording() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const video = document.getElementById('preview');
    video.srcObject = null;
    video.src = url;

    startBtn.disabled = false;
    stopBtn.disabled = true;
    downloadBtn.disabled = false;
    status.textContent = 'Recording ready to download';
}

function downloadRecording() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `ProScreen_${new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    status.textContent = 'Recording downloaded';
}

if (!navigator.mediaDevices.getDisplayMedia) {
    status.textContent = 'Screen recording not supported in this browser';
    startBtn.disabled = true;
}