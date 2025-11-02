//landing page
document.addEventListener("DOMContentLoaded", () => {
    let heroBtn = document.querySelector(".hero-btn");
    heroBtn.addEventListener("click", (e) => {
        document.querySelector("#hook-section").scrollIntoView({ behavior: "smooth" });
    });
});

//hook-section
let findOutBtn = document.getElementById('find-out-btn');
let introText = document.querySelector('.intro-text');
let caffeineCards = document.querySelector('.type-of-caffeine-cards');
let hookAnswer = document.querySelector('.hook-answer');

findOutBtn.addEventListener('click', () => {

    introText.style.transform = 'translateY(-30px)';
    caffeineCards.classList.toggle('visible');
    hookAnswer.classList.toggle('visible');
});

