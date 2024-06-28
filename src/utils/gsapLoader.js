// utils/gsapLoader.js
import gsap from "gsap";

export const gsapLoader = () => {
    const messages = [
        "Tuning the piano...",
        "Pressing the keys...",
        "Pedaling smoothly...",
        "Harmonizing notes...",
        "Finding the tempo...",
        "Syncing with the melody...",
        "Polishing the keys...",
        "Adjusting the pitch...",
        "Exploring chords...",
        "Improvising melodies...",
        "Creating harmonies...",
        "Enhancing dynamics...",
        "Setting the rhythm...",
        "Mastering scales...",
        "Playing crescendos...",
        "Enjoying the silence...",
        "Capturing emotions...",
        "Reflecting on music...",
        "Inspiring compositions...",
        "Learning new pieces...",
        "Exploring music theory...",
        "Sharing musical joy...",
        "Connecting through music..."
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.textContent = randomMessage;
    loader.style.position = 'fixed';
    loader.style.top = '50%';
    loader.style.left = '50%';
    loader.style.transform = 'translate(-50%, -50%)';
    loader.style.opacity = 0; // Initial opacity

    document.body.appendChild(loader);

    // Animate loader using GSAP
    const tl = gsap.timeline();
    tl.to(loader, { opacity: 1, duration: 0.5, ease: "power1.inOut" })
      .to(loader, { opacity: 0, duration: 0.5, ease: "power1.inOut" })
      .then(() => {
          loader.remove(); // Remove loader after animation completes
      });

    return tl;
};
