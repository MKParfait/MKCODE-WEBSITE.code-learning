(() => {
  "use strict";

  const courses = window.MKCODE_COURSES || [];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "mkcode-completed-lessons-v1";
  const starterCode = {
    html: '<main class="demo-card">\n  <p class="eyebrow">MY FIRST PROJECT</p>\n  <h1>Hello, coder! 👋</h1>\n  <p>Edit this code and make it yours.</p>\n  <button id="helloButton">Click me</button>\n  <p id="message" aria-live="polite"></p>\n</main>',
    css: 'body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #eef5ff;\n  font-family: Arial, sans-serif;\n}\n.demo-card {\n  width: min(85%, 340px);\n  padding: 28px;\n  border-radius: 18px;\n  background: white;\n  box-shadow: 0 15px 40px #17255420;\n  text-align: center;\n}\nh1 { color: #111827; }\n.eyebrow { color: #0284c7; font-size: 11px; letter-spacing: 2px; }\nbutton { border: 0; border-radius: 9px; padding: 11px 16px; background: #0891b2; color: white; cursor: pointer; }',
    js: 'document.getElementById("helloButton").addEventListener("click", () => {\n  document.getElementById("message").textContent = "You made it work! ✨";\n});'
  };
  let activeEditor = "html";
  let code = { ...starterCode };
  let toastTimeout;
  let activeFilter = "all";
  let activeCourseId = null;
  let activeLessonIndex = 0;

  function readProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }
  function saveProgress(progress) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch { showToast("Progress could not be saved in this browser."); }
  }
  function completedCount(courseId) {
    const progress = readProgress();
    return Array.isArray(progress[courseId]) ? progress[courseId].length : 0;
  }
  function isLessonComplete(courseId, index) {
    const progress = readProgress();
    return Array.isArray(progress[courseId]) && progress[courseId].includes(index);
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
  }
  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function renderCourses() {
    const grid = $("#courseGrid");
    if (!grid) return;
    const query = ($("#courseSearch")?.value || "").trim().toLowerCase();
    const visible = courses.filter((course) => {
      const matchesFilter = activeFilter === "all" || course.category === activeFilter;
      const matchesSearch = `${course.title} ${course.description} ${course.level} ${course.lessons.map(x => x.title).join(" ")}`.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
    grid.innerHTML = visible.map((course) => {
      const completed = completedCount(course.id);
      const percent = Math.round(completed / course.lessons.length * 100);
      return `<article class="course-card" style="--course-glow:${course.color};--icon-color:${course.color};--icon-bg:${course.color}17;--icon-border:${course.color}45">
        <div class="course-top"><div class="course-icon">${escapeHtml(course.icon)}</div><span class="course-level">${escapeHtml(course.level)}</span></div>
        <h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.description)}</p>
        <div class="course-meta"><span>▤ ${course.lessons.length} lessons</span><span>◷ ${escapeHtml(course.duration)}</span><span>${percent}% complete</span></div>
        <div class="course-progress" aria-label="${percent}% completed"><span style="width:${percent}%"></span></div>
        <button class="course-open" data-open-course="${escapeHtml(course.id)}">Open learning path <span>→</span></button>
      </article>`;
    }).join("");
    $("#emptyCourses")?.classList.toggle("hidden", visible.length > 0);
  }

  function renderLesson(courseId, lessonIndex = 0) {
    const course = courses.find(item => item.id === courseId);
    if (!course) { showToast("That course could not be found."); return; }
    activeCourseId = courseId;
    activeLessonIndex = Math.max(0, Math.min(lessonIndex, course.lessons.length - 1));
    const lesson = course.lessons[activeLessonIndex];
    const completed = isLessonComplete(course.id, activeLessonIndex);
    const progress = Math.round(completedCount(course.id) / course.lessons.length * 100);
    const modal = document.createElement("div");
    modal.className = "lesson-overlay";
    modal.id = "lessonOverlay";
    modal.innerHTML = `
      <section class="lesson-dialog" role="dialog" aria-modal="true" aria-labelledby="lessonTitle">
        <header class="lesson-header"><div><span class="lesson-kicker">${escapeHtml(course.title)}</span><h2 id="lessonTitle">${escapeHtml(lesson.title)}</h2></div><button class="lesson-close" data-close-lesson aria-label="Close lesson">×</button></header>
        <div class="lesson-progress-row"><span>Lesson ${activeLessonIndex + 1} of ${course.lessons.length}</span><span>${progress}% of this course complete</span></div>
        <div class="lesson-progress"><span style="width:${progress}%"></span></div>
        <div class="lesson-content">
          <div class="lesson-time">◷ ${escapeHtml(lesson.time)} <span>•</span> ${escapeHtml(course.level)}</div>
          <p>${escapeHtml(lesson.explanation)}</p>
          <h3>Example</h3><pre class="lesson-code"><code>${escapeHtml(lesson.example.replace(/\\n/g, "\n"))}</code><button class="copy-example" data-copy-example>Copy</button></pre>
          <div class="exercise-box"><span class="exercise-label">PRACTICE TASK</span><p>${escapeHtml(lesson.task)}</p><label for="lessonAnswer">Try writing your answer here</label><textarea id="lessonAnswer" rows="4" spellcheck="false" placeholder="Write your code or answer..."></textarea><div class="exercise-actions"><button class="small-button" data-show-hint>Show sample answer</button><button class="button button-secondary" data-check-answer>Check my answer</button></div><pre class="sample-answer hidden" id="sampleAnswer">${escapeHtml(lesson.solution)}</pre><p class="lesson-feedback hidden" id="lessonFeedback" role="status"></p></div>
        </div>
        <footer class="lesson-footer"><button class="button button-secondary" data-prev-lesson ${activeLessonIndex === 0 ? "disabled" : ""}>← Previous</button><button class="button ${completed ? "button-secondary" : "button-primary"}" data-mark-complete>${completed ? "✓ Completed" : "Mark complete ✓"}</button><button class="button button-secondary" data-next-lesson ${activeLessonIndex === course.lessons.length - 1 ? "disabled" : ""}>Next →</button></footer>
      </section>`;
    $("#lessonOverlay")?.remove();
    document.body.appendChild(modal);
    document.body.classList.add("modal-open");
    modal.addEventListener("click", handleLessonClick);
    $("#lessonAnswer", modal)?.focus();
  }

  function closeLesson() {
    $("#lessonOverlay")?.remove();
    document.body.classList.remove("modal-open");
    activeCourseId = null;
    renderCourses();
  }

  function handleLessonClick(event) {
    const button = event.target.closest("button");
    if (!button) {
      if (event.target.id === "lessonOverlay") closeLesson();
      return;
    }
    if (button.hasAttribute("data-close-lesson")) { closeLesson(); return; }
    const course = courses.find(item => item.id === activeCourseId);
    if (!course) return;
    if (button.hasAttribute("data-prev-lesson")) { if (activeLessonIndex > 0) renderLesson(activeCourseId, activeLessonIndex - 1); return; }
    if (button.hasAttribute("data-next-lesson")) { if (activeLessonIndex < course.lessons.length - 1) renderLesson(activeCourseId, activeLessonIndex + 1); return; }
    if (button.hasAttribute("data-mark-complete")) {
      const progress = readProgress();
      const list = Array.isArray(progress[course.id]) ? progress[course.id] : [];
      if (!list.includes(activeLessonIndex)) list.push(activeLessonIndex);
      progress[course.id] = list.sort((a,b) => a-b);
      saveProgress(progress);
      showToast("Lesson progress saved on this device.");
      renderLesson(course.id, activeLessonIndex);
      renderCourses();
      return;
    }
    if (button.hasAttribute("data-show-hint")) { $("#sampleAnswer")?.classList.toggle("hidden"); return; }
    if (button.hasAttribute("data-copy-example")) {
      const lesson = course.lessons[activeLessonIndex];
      const example = lesson.example.replace(/\\n/g, "\n");
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(example).then(() => showToast("Example copied.")).catch(() => showToast("Copy was blocked by your browser."));
      else showToast("Clipboard access is unavailable. Select and copy the example text.");
      return;
    }
    if (button.hasAttribute("data-check-answer")) {
      const answer = ($("#lessonAnswer")?.value || "").trim();
      const feedback = $("#lessonFeedback");
      if (!answer) {
        feedback.textContent = "Write an attempt first. It is okay if it is not perfect.";
      } else {
        feedback.textContent = "Good effort! Compare your approach with the sample answer. This starter checker checks that you made an attempt, not whether every answer is fully correct.";
      }
      feedback.classList.remove("hidden");
    }
  }

  function currentCode() {
    code[activeEditor] = $("#codeEditor")?.value ?? code[activeEditor];
    return code[activeEditor];
  }
  function setEditorTab(tab) {
    currentCode();
    activeEditor = tab;
    $$(".editor-tab").forEach(button => button.classList.toggle("active", button.dataset.editor === tab));
    $("#codeEditor").value = code[tab];
    $("#codeEditor").setAttribute("aria-label", `${tab.toUpperCase()} code editor`);
  }
  function runCode() {
    currentCode();
    const frame = $("#previewFrame");
    if (!frame) return;
    const safeCss = code.css;
    const doc = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${safeCss}</style></head><body>${code.html}<script>try { ${code.js.replace(/<\/script/gi, "<\\/script")} } catch (error) { document.body.insertAdjacentHTML("beforeend", '<pre style="color:#b91c1c;background:#fee;padding:12px;white-space:pre-wrap">JavaScript error: ' + String(error.message).replace(/[<>&]/g, '') + '</pre>'); }<\/script></body></html>`;
    frame.srcdoc = doc;
    showToast("Preview updated.");
  }
  function resetCode() {
    code = { ...starterCode };
    setEditorTab("html");
    runCode();
    showToast("Starter code restored.");
  }

  function setupNavigation() {
    const toggle = $("#menuToggle");
    const nav = $("#mainNav");
    toggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    $$(".nav-link").forEach(link => link.addEventListener("click", () => {
      nav?.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
    }));
    $$('[data-open-theme-inline]').forEach(button => button.addEventListener('click', openThemePanel));
    document.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        $("#courseSearch")?.focus();
      }
      if (event.key === "Escape" && $("#lessonOverlay")) closeLesson();
    });
    const sections = $$("main section[id]");
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          $$(".nav-link").forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
      sections.forEach(section => observer.observe(section));
    }
    const back = $("#backToTop");
    window.addEventListener("scroll", () => back?.classList.toggle("visible", window.scrollY > 550), { passive: true });
    back?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function setupReveal() {
    const elements = $$(".reveal");
    if (!("IntersectionObserver" in window)) { elements.forEach(el => el.classList.add("is-visible")); return; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    elements.forEach(el => observer.observe(el));
  }

  function setupContactForm() {
    $("#contactForm")?.addEventListener("submit", event => {
      event.preventDefault();
      const name = $("#contactName").value.trim();
      const email = $("#contactEmail").value.trim();
      const message = $("#contactMessage").value.trim();
      if (!name || !email || !message) { showToast("Please complete all contact fields."); return; }
      const subject = encodeURIComponent(`MKCode message from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      showToast("Opening your email app. Review the message before sending.");
      window.location.href = `mailto:parfaitmurindangabo@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  function setupEvents() {
    $("#courseSearch")?.addEventListener("input", renderCourses);
    $("#courseFilters")?.addEventListener("click", event => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      activeFilter = button.dataset.filter;
      $$(".filter-chip").forEach(chip => chip.classList.toggle("active", chip === button));
      renderCourses();
    });
    $("#courseGrid")?.addEventListener("click", event => {
      const button = event.target.closest("[data-open-course]");
      if (button) renderLesson(button.dataset.openCourse, 0);
    });
    $$(".editor-tab").forEach(button => button.addEventListener("click", () => setEditorTab(button.dataset.editor)));
    $("#codeEditor")?.addEventListener("input", () => { code[activeEditor] = $("#codeEditor").value; });
    $("#runCode")?.addEventListener("click", runCode);
    $("#refreshPreview")?.addEventListener("click", runCode);
    $("#resetCode")?.addEventListener("click", resetCode);
  }

  function addLessonStyles() {
    const style = document.createElement("style");
    style.textContent = `
      body.modal-open { overflow: hidden; }
      .lesson-overlay { position: fixed; inset: 0; z-index: 100; padding: 24px; display: grid; place-items: center; background: rgba(2,5,12,.82); backdrop-filter: blur(12px); overflow-y: auto; }
      .lesson-dialog { width: min(760px, 100%); max-height: min(88vh, 900px); overflow-y: auto; border: 1px solid rgba(0,217,255,.22); border-radius: 18px; background: #0b1324; box-shadow: 0 30px 100px #0009; }
      .lesson-header { display:flex; justify-content:space-between; align-items:flex-start; gap:18px; padding:25px 27px 18px; border-bottom:1px solid var(--line); }
      .lesson-kicker { color:var(--cyan); font-size:10px; letter-spacing:1.5px; text-transform:uppercase; }
      .lesson-header h2 { margin:6px 0 0; font-size:clamp(22px,4vw,30px); line-height:1.2; letter-spacing:-.8px; }
      .lesson-close { width:34px;height:34px;border:1px solid var(--line);border-radius:9px;background:transparent;color:var(--muted);font-size:25px;line-height:1;cursor:pointer; }
      .lesson-progress-row { display:flex;justify-content:space-between;gap:12px;padding:15px 27px 8px;color:var(--muted);font-size:10px; }
      .lesson-progress {height:3px;margin:0 27px;background:#ffffff12;border-radius:4px;overflow:hidden}.lesson-progress span {display:block;height:100%;background:linear-gradient(90deg,var(--cyan),var(--purple))}
      .lesson-content { padding:20px 27px 25px; }.lesson-time {color:#8291ac;font-size:10px;margin-bottom:13px}.lesson-time span {margin:0 8px}
      .lesson-content > p {color:#c0cce1;font-size:13px;line-height:1.9}.lesson-content h3 {font-size:16px;margin:20px 0 10px}
      .lesson-code,.sample-answer {position:relative;white-space:pre-wrap;overflow-wrap:anywhere;background:#060b16;border:1px solid var(--line);border-radius:10px;padding:17px;color:#b9f6df;font:12px/1.8 Consolas,monospace}
      .copy-example {position:absolute;right:8px;top:8px;padding:5px 8px;border:1px solid var(--line);border-radius:6px;background:#101b2d;color:#9babc7;font-size:9px;cursor:pointer}
      .exercise-box {margin-top:23px;padding:18px;border:1px solid rgba(168,85,247,.25);border-radius:12px;background:rgba(168,85,247,.045)}
      .exercise-label {color:#c5a3ff;font-size:9px;letter-spacing:1.5px;font-weight:700}.exercise-box > p {color:#e1e8f7;font-size:12px;line-height:1.8}
      .exercise-box label {display:block;color:var(--muted);font-size:10px;margin-bottom:7px}
      .exercise-box textarea {width:100%;resize:vertical;background:#070d1a;border:1px solid var(--line);border-radius:8px;color:#e4edff;padding:12px;font:12px/1.7 Consolas,monospace}
      .exercise-actions {display:flex;flex-wrap:wrap;gap:9px;margin-top:10px}.exercise-actions .button {min-height:34px;padding:8px 11px;font-size:10px}
      .sample-answer {margin:12px 0 0;color:#c8b2ff}.lesson-feedback {font-size:11px;color:var(--green);margin:12px 0 0}
      .lesson-footer {display:flex;justify-content:space-between;gap:9px;padding:15px 27px;border-top:1px solid var(--line);background:#0a1120;position:sticky;bottom:0}
      .lesson-footer .button {min-height:37px;padding:8px 12px;font-size:10px}.lesson-footer .button:disabled {opacity:.35;cursor:not-allowed;transform:none}
      @media(max-width:560px){.lesson-overlay{padding:8px}.lesson-dialog{max-height:94vh}.lesson-header{padding:19px 17px 15px}.lesson-progress-row{padding-inline:17px}.lesson-progress{margin-inline:17px}.lesson-content{padding:17px}.lesson-footer{padding:12px;gap:6px}.lesson-footer .button{padding:8px;font-size:9px}.exercise-box{padding:13px}}
    `;
    document.head.appendChild(style);
  }

  const THEME_KEY = "mkcode-appearance-v1";
  const themeDefaults = { theme: "light", accent: "#087fba", font: "modern", scale: 100, corners: "rounded", style: "soft" };
  function getThemePrefs() {
    try { return { ...themeDefaults, ...JSON.parse(localStorage.getItem(THEME_KEY) || "{}") }; }
    catch { return { ...themeDefaults }; }
  }
  function saveThemePrefs(prefs) {
    try { localStorage.setItem(THEME_KEY, JSON.stringify(prefs)); } catch { /* Storage may be disabled. */ }
  }
  function applyThemePrefs(prefs) {
    const html = document.documentElement;
    html.dataset.theme = prefs.theme;
    html.dataset.font = prefs.font;
    html.dataset.corners = prefs.corners;
    html.dataset.style = prefs.style;
    html.style.setProperty("--accent-custom", prefs.accent);
    html.style.setProperty("--text-scale", String(Number(prefs.scale || 100) / 100));
    const accentInput = $("#accentColor"); if (accentInput) accentInput.value = prefs.accent;
    const fontSelect = $("#fontChoice"); if (fontSelect) fontSelect.value = prefs.font;
    const scaleInput = $("#textScale"); if (scaleInput) scaleInput.value = prefs.scale;
    const scaleValue = $("#textScaleValue"); if (scaleValue) scaleValue.textContent = `${prefs.scale}%`;
    $$("[data-theme-choice]").forEach(btn => btn.classList.toggle("selected", btn.dataset.themeChoice === prefs.theme));
    $$('[data-corners]').forEach(btn => btn.classList.toggle('selected', btn.dataset.corners === prefs.corners));
    $$('[data-style]').forEach(btn => btn.classList.toggle('selected', btn.dataset.style === prefs.style));
    const themeColor = document.querySelector('meta[name="theme-color"]'); if (themeColor) themeColor.content = prefs.theme === 'dark' ? '#070b16' : prefs.theme === 'midnight' ? '#071a2c' : prefs.theme === 'purple' ? '#f8f4ff' : prefs.theme === 'forest' ? '#f2f8f3' : '#f5f8ff';
  }
  function openThemePanel() {
    const panel = $("#themePanel"), backdrop = $("#themeBackdrop");
    panel?.classList.add("open"); backdrop?.classList.add("open");
    panel?.setAttribute("aria-hidden", "false");
    $("#closeTheme")?.focus();
  }
  function closeThemePanel() {
    const panel = $("#themePanel"), backdrop = $("#themeBackdrop");
    panel?.classList.remove("open"); backdrop?.classList.remove("open");
    panel?.setAttribute("aria-hidden", "true");
    $("#openTheme")?.focus();
  }
  function setupThemeCustomizer() {
    let prefs = getThemePrefs();
    applyThemePrefs(prefs);
    $("#openTheme")?.addEventListener("click", openThemePanel);
    $("#closeTheme")?.addEventListener("click", closeThemePanel);
    $("#doneTheme")?.addEventListener("click", closeThemePanel);
    $("#themeBackdrop")?.addEventListener("click", closeThemePanel);
    $("#resetTheme")?.addEventListener("click", () => { prefs = { ...themeDefaults }; saveThemePrefs(prefs); applyThemePrefs(prefs); showToast("Default light theme restored."); });
    $$('[data-theme-choice]').forEach(btn => btn.addEventListener('click', () => { prefs.theme = btn.dataset.themeChoice; saveThemePrefs(prefs); applyThemePrefs(prefs); }));
    $("#accentColor")?.addEventListener("input", event => { prefs.accent = event.target.value; saveThemePrefs(prefs); applyThemePrefs(prefs); });
    $("#fontChoice")?.addEventListener("change", event => { prefs.font = event.target.value; saveThemePrefs(prefs); applyThemePrefs(prefs); });
    $("#textScale")?.addEventListener("input", event => { prefs.scale = Number(event.target.value); saveThemePrefs(prefs); applyThemePrefs(prefs); });
    $$('[data-corners]').forEach(btn => btn.addEventListener('click', () => { prefs.corners = btn.dataset.corners; saveThemePrefs(prefs); applyThemePrefs(prefs); }));
    $$('[data-style]').forEach(btn => btn.addEventListener('click', () => { prefs.style = btn.dataset.style; saveThemePrefs(prefs); applyThemePrefs(prefs); }));
    document.addEventListener("keydown", event => { if (event.key === "Escape" && $("#themePanel")?.classList.contains("open")) closeThemePanel(); });
  }

  function init() {
    if ($("#currentYear")) $("#currentYear").textContent = new Date().getFullYear();
    if ($("#codeEditor")) $("#codeEditor").value = code[activeEditor];
    renderCourses();
    setupNavigation();
    setupReveal();
    setupContactForm();
    setupEvents();
    addLessonStyles();
    if ($("#previewFrame")) runCode();
    setupThemeCustomizer();
    console.log("MKCode initialized successfully.");
    console.log(`Loaded ${courses.length} learning paths.`);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
