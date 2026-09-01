const { FFmpeg } = FFmpegWASM;
const { fetchFile } = FFmpegUtil;

const state = { file: null, ffmpeg: null, outputUrl: null, converting: false };
const elements = {
  fileInput: document.querySelector('#file-input'), dropzone: document.querySelector('#dropzone'),
  fileCard: document.querySelector('#file-card'), fileName: document.querySelector('#file-name'), fileMeta: document.querySelector('#file-meta'),
  remove: document.querySelector('#remove-file'), extract: document.querySelector('#extract-button'),
  actionMessage: document.querySelector('#action-message'), quality: document.querySelector('#quality'), hint: document.querySelector('#format-hint'),
  progressPanel: document.querySelector('#progress-panel'), progressLabel: document.querySelector('#progress-label'), progressValue: document.querySelector('#progress-value'), progressBar: document.querySelector('#progress-bar'), cancel: document.querySelector('#cancel-button'),
  result: document.querySelector('#result-panel'), audio: document.querySelector('#audio-player'), download: document.querySelector('#download-link'), resultMeta: document.querySelector('#result-meta')
};

const formatInfo = { mp3: { label: 'MP3', mime: 'audio/mpeg', hint: 'MP3 适用于大多数播放器和设备。' }, wav: { label: 'WAV', mime: 'audio/wav', hint: 'WAV 无损且兼容性高，但文件通常较大。' }, aac: { label: 'AAC', mime: 'audio/aac', hint: 'AAC 体积小，适合移动设备和现代播放器。' } };

function selectedFormat() { return document.querySelector('input[name="format"]:checked').value; }
function fileSize(size) { return size < 1024 ** 2 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 ** 2).toFixed(1)} MB`; }
function baseName(name) { return name.replace(/\.[^/.]+$/, '') || 'audio'; }
function cleanOutput() { if (state.outputUrl) URL.revokeObjectURL(state.outputUrl); state.outputUrl = null; elements.result.classList.add('is-hidden'); elements.audio.removeAttribute('src'); }

function setFile(file) {
  if (!file || (!file.type.startsWith('video/') && !/\.(mkv|avi|mov|webm|flv|m4v)$/i.test(file.name))) return;
  state.file = file; cleanOutput();
  elements.fileName.textContent = file.name; elements.fileMeta.textContent = fileSize(file.size);
  elements.fileCard.classList.remove('is-hidden'); elements.dropzone.classList.add('is-hidden');
  elements.extract.disabled = false; elements.actionMessage.textContent = '已添加视频，可开始提取音频。';
}
function resetFile() {
  if (state.converting) return;
  state.file = null; elements.fileInput.value = ''; cleanOutput();
  elements.fileCard.classList.add('is-hidden'); elements.dropzone.classList.remove('is-hidden'); elements.extract.disabled = true;
  elements.actionMessage.textContent = '添加视频文件以继续。';
}
function updateFormat() {
  const format = selectedFormat();
  document.querySelectorAll('.format-option').forEach(label => label.classList.toggle('is-selected', label.querySelector('input').checked));
  elements.hint.textContent = formatInfo[format].hint;
  elements.quality.disabled = format === 'wav';
}
function showProgress(label, percent) {
  elements.progressPanel.classList.remove('is-hidden'); elements.progressLabel.textContent = label;
  const rounded = Math.max(0, Math.min(100, Math.round(percent)));
  elements.progressValue.textContent = `${rounded}%`; elements.progressBar.style.width = `${rounded}%`;
}

async function loadFfmpeg() {
  if (state.ffmpeg?.loaded) return state.ffmpeg;
  showProgress('正在加载本地转换器...', 3);
  const ffmpeg = new FFmpeg();
  ffmpeg.on('progress', ({ progress }) => showProgress('正在提取音频...', Math.max(5, progress * 100)));
  const base = new URL('ffmpeg/', window.location.href);
  await ffmpeg.load({
    coreURL: new URL('ffmpeg-core.js', base).href,
    wasmURL: new URL('ffmpeg-core.wasm', base).href
  });
  state.ffmpeg = ffmpeg;
  return ffmpeg;
}

async function extractAudio() {
  if (!state.file || state.converting) return;
  state.converting = true; elements.extract.disabled = true; elements.extract.querySelector('span:last-child').textContent = '转换中'; cleanOutput();
  const format = selectedFormat(); const info = formatInfo[format]; const inputName = `input-${Date.now()}${state.file.name.match(/\.[^.]+$/)?.[0] || '.mp4'}`; const outputName = `audio.${format}`;
  try {
    const ffmpeg = await loadFfmpeg();
    showProgress('正在读取视频...', 5);
    await ffmpeg.writeFile(inputName, await fetchFile(state.file));
    showProgress('正在提取音频...', 8);
    const args = ['-i', inputName, '-vn'];
    if (format === 'wav') args.push('-c:a', 'pcm_s16le'); else args.push('-c:a', format === 'aac' ? 'aac' : 'libmp3lame', '-b:a', elements.quality.value);
    args.push(outputName);
    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputName);
    await ffmpeg.deleteFile(inputName); await ffmpeg.deleteFile(outputName);
    state.outputUrl = URL.createObjectURL(new Blob([data.buffer], { type: info.mime }));
    elements.audio.src = state.outputUrl; elements.download.href = state.outputUrl; elements.download.download = `${baseName(state.file.name)}.${format}`;
    elements.resultMeta.textContent = `${info.label} · ${fileSize(data.byteLength)} · 已从 ${state.file.name} 提取`;
    showProgress('转换完成', 100); setTimeout(() => elements.progressPanel.classList.add('is-hidden'), 700);
    elements.result.classList.remove('is-hidden'); elements.actionMessage.textContent = '可再次更换视频，或下载已提取的音频。';
  } catch (error) {
    console.error(error); elements.progressPanel.classList.add('is-hidden'); elements.actionMessage.textContent = '转换未完成。请确认视频格式受支持，或尝试较小的视频文件。';
    alert('音频提取失败。请确认视频格式受支持，并尝试较小的视频文件。');
  } finally {
    state.converting = false; elements.extract.disabled = !state.file; elements.extract.querySelector('span:last-child').textContent = '提取音频';
  }
}

elements.fileInput.addEventListener('change', event => setFile(event.target.files[0]));
elements.remove.addEventListener('click', resetFile); elements.extract.addEventListener('click', extractAudio);
document.querySelectorAll('input[name="format"]').forEach(input => input.addEventListener('change', updateFormat));
['dragenter', 'dragover'].forEach(type => elements.dropzone.addEventListener(type, event => { event.preventDefault(); elements.dropzone.classList.add('is-over'); }));
['dragleave', 'drop'].forEach(type => elements.dropzone.addEventListener(type, event => { event.preventDefault(); elements.dropzone.classList.remove('is-over'); }));
elements.dropzone.addEventListener('drop', event => setFile(event.dataTransfer.files[0]));
elements.cancel.addEventListener('click', () => { if (!state.converting) return; state.ffmpeg?.terminate(); state.ffmpeg = null; state.converting = false; elements.progressPanel.classList.add('is-hidden'); elements.extract.disabled = false; elements.extract.querySelector('span:last-child').textContent = '提取音频'; elements.actionMessage.textContent = '已取消转换。'; });
window.addEventListener('beforeunload', () => { if (state.outputUrl) URL.revokeObjectURL(state.outputUrl); });
