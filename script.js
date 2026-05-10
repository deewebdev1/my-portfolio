// ═══════════════════════════════════════════
//  LOADER
// ═══════════════════════════════════════════
const loaderBar = document.getElementById('loaderBar');
const loaderPct = document.getElementById('loaderPct');
const loaderLogo = document.querySelector('.loader-logo');
let loadPct = 0;

gsap.to(loaderLogo, { opacity: 1, duration: 0.6, ease: 'power2.out' });

const loadInterval = setInterval(() => {
    loadPct += Math.random() * 8 + 2;
    if (loadPct >= 100) {
        loadPct = 100;
        clearInterval(loadInterval);
        setTimeout(hideLoader, 400);
    }
    loaderBar.style.width = loadPct + '%';
    loaderPct.textContent = Math.floor(loadPct) + '%';
}, 60);

function hideLoader() {
    gsap.to('#loader', {
        opacity: 0, duration: 0.8, ease: 'power2.inOut',
        onComplete: () => {
            document.getElementById('loader').style.display = 'none';
            startHeroAnimations();
        }
    });
}

// ═══════════════════════════════════════════
//  THREE.JS — 3D PARTICLE UNIVERSE + TUNNEL
// ═══════════════════════════════════════════
const canvas = document.getElementById('hero-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 5);

// — Stars / particle field —
const starCount = 3000;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPos[i * 3]     = (Math.random() - 0.5) * 400;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 400;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 400 - 50;
    const isOrange = Math.random() < 0.15;
    starColors[i*3]   = isOrange ? 1   : 0.6 + Math.random() * 0.4;
    starColors[i*3+1] = isOrange ? 0.42: 0.6 + Math.random() * 0.4;
    starColors[i*3+2] = isOrange ? 0.21: 0.6 + Math.random() * 0.4;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
const starMat = new THREE.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, opacity: 0.8 });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// — Tunnel rings —
const tunnelGroup = new THREE.Group();
const ringCount = 40;
for (let i = 0; i < ringCount; i++) {
    const geo = new THREE.TorusGeometry(4 + Math.random() * 2, 0.04, 6, 80);
    const mat = new THREE.MeshBasicMaterial({
        color: i % 5 === 0 ? 0xFF6B35 : 0x12162a,
        transparent: true, opacity: 0.6
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.z = -i * 6;
    ring.rotation.x = Math.random() * 0.3;
    ring.rotation.y = Math.random() * 0.3;
    tunnelGroup.add(ring);
}
scene.add(tunnelGroup);
tunnelGroup.visible = false;

// — Floating grid plane —
const gridHelper = new THREE.GridHelper(80, 40, 0xFF6B35, 0x12162a);
gridHelper.position.y = -8;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.12;
scene.add(gridHelper);

// — Floating geometric shapes —
const shapes = [];
const shapeGeos = [
    new THREE.OctahedronGeometry(0.6),
    new THREE.TetrahedronGeometry(0.5),
    new THREE.IcosahedronGeometry(0.4),
    new THREE.BoxGeometry(0.7, 0.7, 0.7)
];
for (let i = 0; i < 12; i++) {
    const geo = shapeGeos[i % shapeGeos.length];
    const mat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0xFF6B35 : 0x1a1f3a,
        wireframe: true, transparent: true, opacity: 0.45
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        -5 - Math.random() * 15
    );
    mesh.userData = {
        rotX: (Math.random() - 0.5) * 0.02,
        rotY: (Math.random() - 0.5) * 0.02,
        floatSpeed: 0.3 + Math.random() * 0.5,
        floatOffset: Math.random() * Math.PI * 2
    };
    shapes.push(mesh);
    scene.add(mesh);
}

// Mouse parallax
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// ─── GSAP ScrollTrigger — Camera flies through tunnel ───
gsap.registerPlugin(ScrollTrigger);
let tunnelProgress = 0;

ScrollTrigger.create({
    trigger: '#tunnel-section',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    onUpdate: (self) => {
        tunnelProgress = self.progress;
        camera.position.z = 5 - self.progress * 200;
        camera.position.x = Math.sin(self.progress * Math.PI * 2) * 2 * self.progress;
        camera.rotation.z = self.progress * 0.3;

        tunnelGroup.visible = self.progress > 0.05;
        tunnelGroup.children.forEach(ring => {
            ring.material.opacity = 0.1 + self.progress * 0.7;
        });
        stars.material.opacity = Math.max(0, 0.8 - self.progress * 1.5);

        const bg = document.getElementById('tunnelBg');
        const reveal = document.getElementById('tunnelReveal');
        if (self.progress > 0.6) {
            bg.style.opacity = 0;
            reveal.style.opacity = (self.progress - 0.6) / 0.4;
            reveal.style.transform = `scale(${0.8 + self.progress * 0.2})`;
        } else {
            bg.style.opacity = 1 - self.progress * 1.5;
            reveal.style.opacity = 0;
        }
    }
});

// Reset camera after tunnel
ScrollTrigger.create({
    trigger: '#about',
    start: 'top 80%',
    onEnter: () => {
        gsap.to(camera.position, { z: 5, x: 0, duration: 0.5 });
        gsap.to(camera.rotation, { z: 0, duration: 0.5 });
        tunnelGroup.visible = false;
        stars.material.opacity = 0.8;
    },
    onLeaveBack: () => { tunnelGroup.visible = true; }
});

// ─── Three.js Animation Loop ───
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (tunnelProgress < 0.05) {
        camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.05;
    }

    stars.rotation.y = t * 0.02;
    stars.rotation.x = t * 0.005;
    gridHelper.rotation.y = t * 0.05;

    shapes.forEach(s => {
        s.rotation.x += s.userData.rotX;
        s.rotation.y += s.userData.rotY;
        s.position.y += Math.sin(t * s.userData.floatSpeed + s.userData.floatOffset) * 0.003;
    });

    tunnelGroup.children.forEach((ring, i) => {
        ring.rotation.z = t * 0.1 * (i % 2 === 0 ? 1 : -1);
    });

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ═══════════════════════════════════════════
//  HERO ENTRANCE ANIMATIONS
// ═══════════════════════════════════════════
function startHeroAnimations() {
    const tl = gsap.timeline();
    tl.to('.hero-image-wrap', { opacity: 1, duration: 0.7, ease: 'power3.out' })
      .to('.hero-tag', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .to('.hero-name', { opacity: 1, duration: 0 }, '-=0.3')
      .to('.hero-name .line-inner', { y: '0%', duration: 0.9, stagger: 0.15, ease: 'power4.out' }, '-=0.2')
      .to('.hero-role', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .to('.hero-desc', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .to('.hero-cta', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
      .to('.social-links', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
      .to('.scroll-indicator', { opacity: 1, duration: 0.6 }, '-=0.2');
}

// ═══════════════════════════════════════════
//  CUSTOM CURSOR (desktop only)
// ═══════════════════════════════════════════
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');

if (cursor && follower && window.innerWidth > 768) {
    let fx = 0, fy = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; });

    function moveCursor() {
        cursor.style.transform = `translate(${cx - 6}px, ${cy - 6}px)`;
        fx += (cx - fx) * 0.12;
        fy += (cy - fy) * 0.12;
        follower.style.transform = `translate(${fx - 18}px, ${fy - 18}px)`;
        requestAnimationFrame(moveCursor);
    }
    moveCursor();

    document.querySelectorAll('a, button, .service-card, .project-item, .why-card').forEach(el => {
        el.addEventListener('mouseenter', () => { cursor.classList.add('hover'); follower.classList.add('hover'); });
        el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); follower.classList.remove('hover'); });
    });
}

// ═══════════════════════════════════════════
//  SCROLL REVEAL
// ═══════════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));

// ═══════════════════════════════════════════
//  SKILL BARS ANIMATION
// ═══════════════════════════════════════════
const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.skill-fill').forEach(fill => {
                fill.style.width = fill.dataset.width + '%';
            });
            skillObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-category-card').forEach(c => skillObserver.observe(c));

// ═══════════════════════════════════════════
//  SERVICE CARD MOUSE GLOW EFFECT
// ═══════════════════════════════════════════
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
        const y = ((e.clientY - r.top) / r.height * 100).toFixed(1);
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');
    });
});

// ═══════════════════════════════════════════
//  NAVIGATION — Active Link + Mobile Toggle
// ═══════════════════════════════════════════
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');

// Active link on scroll
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
        if (window.pageYOffset >= sec.offsetTop - 200) current = sec.id;
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
});

// Mobile menu toggle
mobileMenuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    // Animate hamburger to X
    const spans = mobileMenuBtn.querySelectorAll('span');
    if (navMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
    } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    }
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const spans = mobileMenuBtn.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    });
});

// ═══════════════════════════════════════════
//  SMOOTH SCROLL
// ═══════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ═══════════════════════════════════════════
//  CONTACT FORM
// ═══════════════════════════════════════════
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const message = contactForm.querySelector('textarea').value;
        window.location.href = `mailto:deewebdevofficial@gmail.com?subject=New Message from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0D%0A%0D%0AFrom: ${encodeURIComponent(email)}`;
        contactForm.reset();
    });
}

// ═══════════════════════════════════════════
//  FOOTER YEAR
// ═══════════════════════════════════════════
document.getElementById('year').textContent = new Date().getFullYear();

// ═══════════════════════════════════════════
//  ESCAPE KEY — close mobile menu
// ═══════════════════════════════════════════
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        navMenu.classList.remove('active');
        const spans = mobileMenuBtn.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    }
});

// ═══════════════════════════════════════════
//  CONSOLE SIGNATURE
// ═══════════════════════════════════════════
console.log('%c🚀 Deewebdev Portfolio — v2.0 ULTRA', 'color: #FF6B35; font-size: 16px; font-weight: bold;');
console.log('%cDesigned & Built for Olatunde Jeremiah | Lagos, Nigeria', 'color: #8a8fa8; font-size: 12px;');


// ═══════════════════════════════════════════
//  FIX — Force reveal all sections after tunnel
// ═══════════════════════════════════════════
setTimeout(() => {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
        el.classList.add('visible');
    });
}, 100);

// ═══════════════════════════════════════════
//  FIX — Also trigger on scroll just in case
// ═══════════════════════════════════════════
window.addEventListener('scroll', () => {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 80) {
            el.classList.add('visible');
        }
    });
}, { passive: true });