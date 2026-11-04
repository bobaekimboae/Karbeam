import { useEffect, useMemo, useRef, useState } from "react";

const styles = ["스튜디오", "출고 임박", "코믹", "오프로드", "나이트", "인더스트리얼", "스타", "네이처"];
const photoStyles = ["스튜디오", "화이트 스튜디오", "쇼룸", "컬러 팝", "에디토리얼", "골든 아워", "해안 도로", "마운틴 패스", "사막", "가을", "겨울", "시티 나이트", "네온", "루프탑", "클린 로트", "저녁 로트"];
const ratios = [{ label: "세로", value: "9:16", w: 9, h: 16 }, { label: "세로 피드", value: "4:5", w: 4, h: 5 }, { label: "정사각형", value: "1:1", w: 1, h: 1 }, { label: "클래식", value: "4:3", w: 4, h: 3 }, { label: "와이드", value: "16:9", w: 16, h: 9 }];
const ideas = ["휠을 보여주세요", "헤드라이트에 머물러 주세요", "앞모습으로 마무리", "차분하고 부드럽게", "속도감 있게", "후면을 보여주세요"];

function Icon({ name }) {
  const paths = { back: <><path d="m14 18-6-6 6-6"/><path d="M8 12h12"/></>, add: <><path d="M12 5v14M5 12h14"/></>, photo: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>, movie: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></>, upload: <><path d="M12 16V4m-4 4 4-4 4 4"/><path d="M4 16v4h16v-4"/></>, play: <><path d="m9 6 10 6-10 6z"/></>, download: <><path d="M12 3v12m-4-4 4 4 4-4"/><path d="M5 17v4h14v-4"/></>, close: <><path d="m18 6-12 12M6 6l12 12"/></>, chevron: <path d="m6 9 6 6 6-6"/>, sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2z"/><path d="m19 14 1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></>, music: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></> };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function drawFit(ctx, img, x, y, w, h, zoom = 1) {
  if (!img || !img.width || !img.height) return;
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const sw = img.width * scale, sh = img.height * scale;
  ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
}

export function App() {
  const [mode, setMode] = useState("video");
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [price, setPrice] = useState("");
  const [style, setStyle] = useState(styles[0]);
  const [seconds, setSeconds] = useState(10);
  const [ratio, setRatio] = useState("9:16");
  const [quality, setQuality] = useState("720p");
  const [caption, setCaption] = useState(true);
  const [endCard, setEndCard] = useState(true);
  const [audioTrack, setAudioTrack] = useState(null);
  const [photoStyle, setPhotoStyle] = useState(photoStyles[0]);
  const [photoVersions, setPhotoVersions] = useState(1);
  const [photoOutputs, setPhotoOutputs] = useState([]);
  const [activePhotoOutput, setActivePhotoOutput] = useState(0);
  const [menu, setMenu] = useState("");
  const [showHow, setShowHow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState("");
  const [outputName, setOutputName] = useState("");
  const [toast, setToast] = useState("");
  const inputRef = useRef(null);
  const audioInputRef = useRef(null);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const selectedRatio = ratios.find((r) => r.value === ratio) || ratios[0];
  const currentImage = photos[0]?.url;

  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(""), 3000); return () => clearTimeout(id); }, [toast]);

  function addFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith("image/")).slice(0, 12 - photos.length);
    if (!files.length) { setToast("이미지 파일을 선택해 주세요."); return; }
    const next = files.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file), name: file.name }));
    setPhotos((prev) => [...prev, ...next].slice(0, 12));
    setOutput("");
    setPhotoOutputs([]);
  }
  function removePhoto(id) { setPhotos((prev) => { const item = prev.find((p) => p.id === id); if (item) URL.revokeObjectURL(item.url); return prev.filter((p) => p.id !== id); }); setOutput(""); }
  function pickFiles() { inputRef.current?.click(); }
  function downloadVideo() {
    if (!output) return;
    const a = document.createElement("a"); a.href = output; a.download = outputName || "studioos-shortform.webm"; a.click();
  }

  function downloadPhoto() {
    const item = photoOutputs[activePhotoOutput];
    if (!item) return;
    const a = document.createElement("a"); a.href = item.url; a.download = item.name; a.click();
  }

  function selectAudio(file) {
    if (!file) return;
    if (audioTrack?.url) URL.revokeObjectURL(audioTrack.url);
    setAudioTrack({ file, url: URL.createObjectURL(file) });
    setOutput("");
  }

  function removeAudio() {
    if (audioTrack?.url) URL.revokeObjectURL(audioTrack.url);
    setAudioTrack(null);
  }

  async function createPhotoPosts() {
    if (!photos.length) { setToast("먼저 차량 사진을 추가해 주세요."); return; }
    const canvas = canvasRef.current;
    const ratioShape = ratios.find((item) => item.value === ratio) || ratios[1];
    const maxSide = 1080;
    canvas.width = Math.round(maxSide * ratioShape.w / Math.max(ratioShape.w, ratioShape.h));
    canvas.height = Math.round(maxSide * ratioShape.h / Math.max(ratioShape.w, ratioShape.h));
    const ctx = canvas.getContext("2d", { alpha: false });
    const count = Math.min(photoVersions, photos.length);
    setBusy(true); setProgress(5); setPhotoOutputs([]); setOutput("");
    try {
      const outputs = [];
      for (let index = 0; index < count; index += 1) {
        const source = photos[index];
        const image = await new Promise((resolve, reject) => {
          const el = new Image();
          el.onload = () => el.naturalWidth ? resolve(el) : reject(new Error("이미지 크기를 확인할 수 없습니다."));
          el.onerror = () => reject(new Error("사진을 읽을 수 없습니다."));
          el.src = source.url;
        });
        ctx.fillStyle = "#111312"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const filters = { "컬러 팝": "saturate(1.55) contrast(1.08)", "에디토리얼": "contrast(1.07) saturate(.9)", "골든 아워": "sepia(.16) saturate(1.18)", "시티 나이트": "brightness(.82) contrast(1.16) saturate(1.15)", "네온": "saturate(1.55) hue-rotate(-8deg)", "겨울": "saturate(.76) brightness(1.06)", "화이트 스튜디오": "brightness(1.08)" };
        ctx.filter = filters[photoStyle] || "none";
        drawFit(ctx, image, 0, 0, canvas.width, canvas.height, 1.01);
        ctx.filter = "none";
        const gradient = ctx.createLinearGradient(0, canvas.height * .56, 0, canvas.height);
        gradient.addColorStop(0, "rgba(3,5,4,0)"); gradient.addColorStop(1, "rgba(3,5,4,.86)");
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const pad = canvas.width * .075;
        ctx.fillStyle = "#a8e58c"; ctx.font = `600 ${Math.round(canvas.width * .032)}px Arial,sans-serif`; ctx.textAlign = "left";
        ctx.fillText(description.slice(0, 28) || "신규 입고", pad, canvas.height * .79);
        ctx.fillStyle = "#fff"; ctx.font = `700 ${Math.round(canvas.width * .066)}px Arial,sans-serif`;
        if (vehicle) ctx.fillText(vehicle.slice(0, 22), pad, canvas.height * .86);
        if (price) { ctx.font = `600 ${Math.round(canvas.width * .045)}px Arial,sans-serif`; ctx.fillText(price.slice(0, 24), pad, canvas.height * .92); }
        ctx.fillStyle = "#ffffffcf"; ctx.font = `400 ${Math.round(canvas.width * .023)}px Arial,sans-serif`;
        ctx.fillText("STUDIOOS  ·  VERIFIED VEHICLE DETAILS", pad, canvas.height * .965);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!blob) throw new Error("사진 내보내기에 실패했습니다.");
        const fileStem = (vehicle || "studioos").trim().replace(/[^\p{L}\p{N}-]+/gu, "-");
        outputs.push({ url: URL.createObjectURL(blob), name: `${fileStem}-post-${index + 1}.png` });
        setProgress(Math.round((index + 1) / count * 100));
      }
      setPhotoOutputs(outputs); setActivePhotoOutput(0);
      setToast(`${outputs.length}개 사진 게시물을 만들었습니다. PNG로 저장할 수 있어요.`);
    } catch {
      setToast("사진 게시물을 만들지 못했어요. 다른 JPG, PNG, WebP 사진을 선택해 주세요.");
    } finally { setBusy(false); }
  }

  async function createVideo() {
    if (!photos.length) { setToast("먼저 차량 사진을 추가해 주세요."); return; }
    const canvas = canvasRef.current;
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { setToast("이 브라우저는 영상 저장을 지원하지 않습니다. 최신 Chrome 또는 Edge를 이용해 주세요."); return; }
    const supported = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
    if (!supported) { setToast("이 브라우저는 영상 저장을 지원하지 않습니다. Chrome 또는 Edge를 이용해 주세요."); return; }
    setBusy(true); setProgress(0); setOutput(""); setMenu("");
    const width = quality === "1080p" ? 1080 : 720;
    canvas.width = Math.round(width * selectedRatio.w / Math.max(selectedRatio.w, selectedRatio.h));
    canvas.height = Math.round(width * selectedRatio.h / Math.max(selectedRatio.w, selectedRatio.h));
    const ctx = canvas.getContext("2d", { alpha: false });
    let loaded;
    try {
      loaded = await Promise.all(photos.map((p) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve(image) : reject(new Error("이미지 크기를 확인할 수 없습니다."));
        image.onerror = () => reject(new Error("사진을 읽을 수 없습니다."));
        image.src = p.url;
      })));
    } catch {
      setBusy(false);
      setToast("사진을 읽지 못했어요. JPG, PNG, WebP 사진을 다시 선택해 주세요.");
      return;
    }
    if (!loaded.length) { setBusy(false); setToast("영상에 넣을 사진을 추가해 주세요."); return; }
    const videoStream = canvas.captureStream(30);
    let stream = videoStream;
    let audioContext;
    let audioElement;
    if (audioTrack?.url) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass || !window.MediaStream) throw new Error("오디오 믹싱을 지원하지 않습니다.");
        audioContext = new AudioContextClass();
        const destination = audioContext.createMediaStreamDestination();
        audioElement = new Audio(audioTrack.url); audioElement.loop = true;
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(destination);
        await audioContext.resume(); await audioElement.play();
        stream = new MediaStream([...videoStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);
      } catch {
        setBusy(false); setToast("오디오를 시작하지 못했어요. MP3, WAV 또는 M4A 파일을 다시 선택해 주세요.");
        videoStream.getTracks().forEach((track) => track.stop());
        if (audioContext) await audioContext.close().catch(() => {});
        return;
      }
    }
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: supported, videoBitsPerSecond: quality === "1080p" ? 5_000_000 : 2_500_000 });
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: supported });
      const url = URL.createObjectURL(blob);
      setOutput((old) => { if (old) URL.revokeObjectURL(old); return url; });
      setOutputName(`${(vehicle || "studioos").trim().replace(/[^\p{L}\p{N}-]+/gu, "-")}-shortform.webm`);
      setBusy(false); setProgress(100); stream.getTracks().forEach((track) => track.stop());
      audioElement?.pause(); audioContext?.close().catch(() => {});
      setToast("영상이 완성됐어요. 미리보기 후 다운로드할 수 있습니다.");
    };
    recorder.start(250);
    const started = performance.now();
    const duration = seconds * 1000;
    const frame = (now) => {
      const t = Math.min(now - started, duration);
      const scene = Math.max(0, Math.min(loaded.length - 1, Math.floor(t / duration * loaded.length)));
      const local = (t / duration * loaded.length) % 1;
      const img = loaded[scene] || loaded[0];
      if (!img) { recorder.stop(); setBusy(false); setToast("사진을 영상에 불러오지 못했어요. 다시 시도해 주세요."); return; }
      const zoom = 1.02 + local * 0.08;
      ctx.fillStyle = "#111"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const videoFilters = { "코믹": "saturate(1.55) contrast(1.2)", "오프로드": "contrast(1.13) saturate(1.18)", "나이트": "brightness(.8) contrast(1.16)", "인더스트리얼": "contrast(1.2) saturate(.78)", "스타": "brightness(1.08) saturate(1.12)", "네이처": "saturate(1.18) hue-rotate(-5deg)" };
      ctx.filter = videoFilters[style] || "contrast(1.04) saturate(1.03)";
      drawFit(ctx, img, 0, 0, canvas.width, canvas.height, zoom);
      ctx.filter = "none";
      const gradient = ctx.createLinearGradient(0, canvas.height * 0.58, 0, canvas.height);
      gradient.addColorStop(0, "rgba(0,0,0,0)"); gradient.addColorStop(1, "rgba(0,0,0,.78)");
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (caption || vehicle || price) {
        ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 12;
        const pad = canvas.width * .075;
        if (vehicle) { ctx.font = `600 ${Math.round(canvas.width * .065)}px Arial,sans-serif`; ctx.fillText(vehicle.slice(0, 38), pad, canvas.height * .83); }
        if (price) { ctx.font = `600 ${Math.round(canvas.width * .048)}px Arial,sans-serif`; ctx.fillText(price.slice(0, 22), pad, canvas.height * .89); }
        if (caption && description) { ctx.font = `400 ${Math.round(canvas.width * .032)}px Arial,sans-serif`; ctx.fillText(description.slice(0, 48), pad, canvas.height * .94); }
        ctx.shadowBlur = 0;
      }
      if (endCard && t > duration - 1500) {
        const alpha = Math.min(0.86, (t - (duration - 1500)) / 900);
        ctx.fillStyle = `rgba(7,8,7,${alpha})`; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `700 ${Math.round(canvas.width * .075)}px Arial,sans-serif`;
        ctx.fillText(vehicle || "오늘의 추천 차량", canvas.width / 2, canvas.height * .48);
        if (price) { ctx.font = `500 ${Math.round(canvas.width * .045)}px Arial,sans-serif`; ctx.fillText(price, canvas.width / 2, canvas.height * .55); }
        ctx.fillStyle = "#a9e58e"; ctx.font = `600 ${Math.round(canvas.width * .034)}px Arial,sans-serif`; ctx.fillText("문의는 지금 바로", canvas.width / 2, canvas.height * .63);
      }
      setProgress(Math.min(99, Math.round(t / duration * 100)));
      if (t >= duration) { recorder.stop(); return; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  const settings = useMemo(() => [
    { key: "style", label: `스타일: ${style}`, options: styles, pick: setStyle },
    { key: "length", label: `길이: ${seconds}초`, options: [10, 25, 40].map((n) => `${n}초`), pick: (v) => setSeconds(Number.parseInt(v, 10)) },
    { key: "ratio", label: `화면: ${ratio}`, options: ratios.map((r) => `${r.value} ${r.label}`), pick: (v) => setRatio(v.slice(0, v.indexOf(" "))) },
    { key: "quality", label: `화질: ${quality}`, options: ["720p", "1080p"], pick: setQuality },
  ], [style, seconds, ratio, quality]);

  return <div className="app-shell" onClick={(e) => { if (!e.target.closest(".setting-wrap") && !e.target.closest(".ideas-wrap")) setMenu(""); }}>
    <header className="topbar">
      <nav className="nav-pill" aria-label="주 메뉴"><button className="back" aria-label="뒤로"><Icon name="back"/></button><a className="nav-active" href="#create">만들기</a><a href="#projects" onClick={(e)=>{e.preventDefault();setToast("이 브라우저에서 만든 최근 영상만 이 화면에 표시됩니다.");}}>프로젝트</a><a href="#credits" onClick={(e)=>{e.preventDefault();setToast("사진 영상은 이 기기에서 무료로 렌더링됩니다.");}}>크레딧</a></nav>
      <div className="nav-right"><button className="upgrade" onClick={()=>setToast("StudioOS는 로컬 제작을 지원합니다. 생성형 AI 엔진 연결에는 공식 API 정보가 필요합니다.")}><span>♛</span> 요금제</button><button className="credit-pill"><span className="coin">◉</span> 무료 제작</button><button className="avatar" aria-label="계정">S</button></div>
    </header>
    <main id="create">
      <div className="offer"><span>무료 베타</span><span>사진으로 만드는 자동차 숏폼</span><span>→</span></div>
      <h1>{mode === "video" ? "차량을 숏폼으로 바꿔보세요." : "차량 사진 게시물을 만들어보세요."}</h1>
      <section className={`composer ${photos.length ? "has-photos" : ""}`} aria-label="차량 영상 제작기">
        <aside className="mode-rail"><button className={mode === "photo" ? "selected" : ""} onClick={() => setMode("photo")}><Icon name="photo"/><span>사진</span></button><button className={mode === "video" ? "selected" : ""} onClick={() => setMode("video")}><Icon name="movie"/><span>영상</span></button><button className="wake" onClick={() => setToast("빠른 제작 모드가 준비 중입니다.")}><span className="bot">✳</span><span>빠른 제작</span></button></aside>
        <div className="workarea">
          <div className="upload-zone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
            {!photos.length ? <><button className="add-button" onClick={pickFiles} aria-label="사진 추가"><Icon name="add"/></button><div className="upload-copy"><button className="upload-link" onClick={pickFiles}>차량 사진을 추가하세요</button><span>여러 장을 한 번에 선택할 수 있어요 · 최대 12장</span></div><button className="lightbulb" onClick={() => setMenu(menu === "ideas" ? "" : "ideas")} aria-label="아이디어"><Icon name="sparkle"/></button></> : <div className="photo-strip">{photos.map((p, i) => <div className="photo-thumb" key={p.id}><img src={p.url} alt={`차량 사진 ${i+1}`}/><span>{i+1}</span><button onClick={()=>removePhoto(p.id)} aria-label="사진 삭제"><Icon name="close"/></button></div>)}<button className="add-more" onClick={pickFiles}><Icon name="add"/> 사진 추가</button></div>}
          </div>
          <div className="vehicle-fields"><input value={vehicle} onChange={(e)=>setVehicle(e.target.value)} placeholder="차량명 (예: 현대 그랜저)" aria-label="차량명"/><input value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="판매 가격 (선택)" aria-label="판매 가격"/></div>
          <div className="description-row"><textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder={mode === "video" ? "어떤 분위기의 숏폼을 만들까요? (선택)" : "게시물에 담을 문구를 적어주세요 (선택)"} aria-label="영상 설명" rows="2"/><div className="ideas-wrap"><button className="ideas-button" onClick={()=>setMenu(menu === "ideas" ? "" : "ideas")}>아이디어 <Icon name="chevron"/></button>{menu === "ideas" && <div className="popover ideas-pop">{ideas.map((idea)=><button key={idea} onClick={()=>{setDescription(idea);setMenu("")}}>{idea}</button>)}</div>}</div></div>
          {mode === "video" && <div className="settings-row" role="group" aria-label="영상 설정">{settings.map((item)=><div className="setting-wrap" key={item.key}><button className="setting-chip" onClick={()=>setMenu(menu === item.key ? "" : item.key)}>{item.label}</button>{menu === item.key && <div className="popover setting-pop">{item.options.map((option)=><button key={option} className={(item.key === "style" ? style === option : item.key === "length" ? `${seconds}초` === option : item.key === "quality" ? quality === option : `${ratio} ${selectedRatio.label}` === option) ? "option-selected" : ""} onClick={()=>{item.pick(option);setMenu("")}}>{option}</button>)}</div>}</div>)}
            <button className={`setting-chip toggle-chip ${endCard ? "on" : ""}`} onClick={()=>setEndCard(!endCard)}><span className="toggle-dot"/>{endCard ? "엔드 카드" : "엔드 카드 없음"}</button><button className={`setting-chip ${caption ? "" : "muted"}`} onClick={()=>setCaption(!caption)}>자막: {caption ? "사용" : "끄기"}</button></div>}
          {mode === "video" && <div className="audio-row"><input ref={audioInputRef} className="visually-hidden" type="file" accept="audio/*" onChange={(e)=>{selectAudio(e.target.files?.[0]);e.target.value=""}}/><button className="setting-chip audio-pick" onClick={()=>audioInputRef.current?.click()}><Icon name="music"/>{audioTrack ? "오디오 변경" : "음성·음악 파일 추가"}</button>{audioTrack && <><span className="audio-name" title={audioTrack.file.name}>{audioTrack.file.name}</span><button className="audio-remove" onClick={removeAudio} aria-label="오디오 삭제"><Icon name="close"/></button></>}<small>내 음성 또는 음악 파일을 영상에 넣습니다.</small></div>}
          {mode === "photo" && <div className="settings-row"><div className="setting-wrap"><button className="setting-chip" onClick={()=>setMenu(menu === "photoStyle" ? "" : "photoStyle")}>스타일: {photoStyle}</button>{menu === "photoStyle" && <div className="popover setting-pop">{photoStyles.map((item)=><button key={item} className={photoStyle===item?"option-selected":""} onClick={()=>{setPhotoStyle(item);setMenu("")}}>{item}</button>)}</div>}</div><button className="setting-chip" onClick={()=>setRatio(ratio === "4:5" ? "1:1" : ratio === "1:1" ? "9:16" : "4:5")}>화면: {ratio}</button><button className="setting-chip" onClick={()=>setPhotoVersions(photoVersions%3+1)}>버전: {photoVersions}개</button></div>}
          <div className="composer-footer"><div className="footer-hint"><span className="green-dot"/> 사진은 기기에서 처리됩니다</div><div className="actions"><button className="preview-button" disabled={!photos.length} onClick={()=>photos.length && document.getElementById("preview-section")?.scrollIntoView({behavior:"smooth",block:"center"})}><span>◎</span> 미리보기</button><button className="create-button" onClick={mode === "video" ? createVideo : createPhotoPosts} disabled={busy}>{busy ? <><span className="spinner"/> {mode === "video" ? "영상" : "게시물"} 제작 중 {progress}%</> : <><Icon name={mode === "video" ? "movie" : "photo"}/> {mode === "video" ? "영상 만들기" : "사진 게시물 만들기"}<small>무료</small></>}</button></div></div>
          {busy && <div className="progress-track"><div style={{width:`${progress}%`}}/></div>}
        </div>
      </section>
      {photos.length > 0 && <section className="preview-section" id="preview-section"><div className="section-title"><div><span className="eyebrow">미리보기</span><h2>{mode === "photo" ? (photoOutputs.length ? "완성된 사진 게시물" : "사진 게시물 미리보기") : (output ? "완성된 영상" : "선택한 사진")}</h2></div>{output && <button className="download-button" onClick={downloadVideo}><Icon name="download"/> 영상 다운로드</button>}{photoOutputs.length>0 && <button className="download-button" onClick={downloadPhoto}><Icon name="download"/> PNG 다운로드</button>}</div>
        {mode === "photo" && photoOutputs.length>0 ? <div className="poster-result"><img src={photoOutputs[activePhotoOutput].url} alt={`사진 게시물 ${activePhotoOutput+1}`}/><div className="result-meta"><span>PNG 게시물 · {ratio} · {photoOutputs.length}개 버전</span><button onClick={downloadPhoto}><Icon name="download"/> 게시물 다운로드</button></div>{photoOutputs.length>1&&<div className="poster-pages">{photoOutputs.map((item,index)=><button className={index===activePhotoOutput?"active":""} key={item.url} onClick={()=>setActivePhotoOutput(index)}>버전 {index+1}</button>)}</div>}</div> : output ? <div className="video-result"><video src={output} controls playsInline/><div className="result-meta"><span>WebM 영상 · {ratio} · {quality}{audioTrack?" · 오디오 포함":""}</span><button onClick={downloadVideo}><Icon name="download"/> 다운로드</button></div></div> : <div className="preview-grid"><div className="preview-phone" style={{aspectRatio:`${selectedRatio.w}/${selectedRatio.h}`}}>{currentImage && <img src={currentImage} alt="선택한 차량 미리보기"/>}<div className="preview-shade"/><div className="preview-label"><b>{vehicle || "차량명"}</b>{price && <span>{price}</span>}{caption && description && <small>{description}</small>}</div><span className="preview-play"><Icon name="play"/></span></div><div className="preview-details"><div className="detail-chip">{mode === "video" ? style : photoStyle}</div><p>{mode === "video" ? `${photos.length}장 · ${seconds}초 · ${ratio}` : `${photos.length}장 · ${ratio} · ${photoVersions}개 버전`}</p><p>{mode === "video" ? "영상 만들기를 누르면 사진 전환과 움직임이 포함된 미리보기를 생성합니다." : "차량 사진, 제목, 가격을 담은 SNS 게시물 이미지를 생성합니다."}</p></div></div>}
      </section>}
      <button className="how-button" onClick={()=>setShowHow(!showHow)}>사용 방법 <Icon name="chevron"/></button>
      {showHow && <div className="how-panel"><article><span>01</span><div><b>차량 사진 추가</b><p>차량의 외관·실내 사진을 여러 장 선택하세요.</p></div></article><article><span>02</span><div><b>영상 분위기 설정</b><p>스타일, 길이, 화면 비율과 차량 정보를 선택하세요.</p></div></article><article><span>03</span><div><b>미리보기와 저장</b><p>브라우저에서 영상을 만들고 재생을 확인한 뒤 WebM으로 저장하세요.</p></div></article></div>}
    </main>
    <footer className="site-footer"><div><strong>StudioOS by iamjapinder</strong><span>차량 사진으로 만드는 숏폼</span></div><small>사진과 오디오는 브라우저 안에서 처리되며 서버에 업로드되지 않습니다.</small></footer>
    <input ref={inputRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={(e)=>{addFiles(e.target.files);e.target.value=""}}/>
    <canvas ref={canvasRef} className="render-canvas" aria-hidden="true"/>
    {toast && <div className="toast" role="status">{toast}<button onClick={()=>setToast("")} aria-label="닫기"><Icon name="close"/></button></div>}
  </div>;
}

