
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwlkzr-5u_FtYoOVRURsB-tOyzR35-D9aDAg5fzZC2kJIFKfAutCY_f6Yoy28g1gNyig/exec";

const sections = [
{
key:"loket",
title:"PETUGAS LOKET",
jumlah:4
},
{
key:"barang",
title:"PENGGELEDAHAN BARANG",
jumlah:5
},
{
key:"badan",
title:"PENGGELEDAHAN BADAN",
jumlah:9
},
{
key:"aula",
title:"PENGAWAS AULA",
jumlah:4
},
{
key:"pintu",
title:"PETUGAS PINTU",
jumlah:8
}
];

let currentSlide = 0;
let petugasData = {};

async function loadPetugas(){
    try{
        const res = await fetch("assets/petugas.json");
        petugasData = await res.json();
        renderSlides();
    }catch(err){
        console.error(err);

        Swal.fire({
            icon:"error",
            title:"Gagal",
            text:"Data petugas tidak ditemukan."
        });
    }
}

function createStaffHTML(section){
    const data = petugasData[section.key] || [];

    return data.map(p => `
        <div class="staff-item" data-key="${section.key}" data-name="${p.nama}">
            <img src="assets/${p.foto}" alt="${p.nama}">
            <span>${p.nama}</span>
        </div>
    `).join("");
}

function renderSlides(){

    const container = document.getElementById("slidesContainer");

    sections.forEach(section => {

        const slide = document.createElement("div");
        slide.className = "slide";

        slide.innerHTML = `
            <div class="card">
                <h3>${section.title}</h3>
                <p>
                    Pilih petugas yang melayani Anda dan berikan penilaian.
                </p>

                <div class="staff-grid">
                    ${createStaffHTML(section)}
                </div>

                <input type="hidden" name="${section.key}_petugas">

                <div class="rating" data-key="${section.key}">
                    <i class="fa-solid fa-star" data-value="1"></i>
                    <i class="fa-solid fa-star" data-value="2"></i>
                    <i class="fa-solid fa-star" data-value="3"></i>
                    <i class="fa-solid fa-star" data-value="4"></i>
                    <i class="fa-solid fa-star" data-value="5"></i>
                </div>

                <input type="hidden" name="${section.key}_rating">
            </div>
        `;

        container.appendChild(slide);
    });

    // Slide komentar
    const commentSlide = document.createElement("div");
    commentSlide.className = "slide";

    commentSlide.innerHTML = `
        <div class="card">
            <h3>Komentar dan Saran</h3>
            <p>
                Tuliskan kritik, saran, atau masukan untuk pelayanan kami.
            </p>

            <div class="comment-box">
                <textarea name="komentar" placeholder="Tuliskan komentar Anda di sini..."></textarea>
            </div>

            <button type="submit" class="primary-btn" id="submitBtn">
                <i class="fa-solid fa-paper-plane"></i>
                Kirim Penilaian
            </button>
        </div>
    `;

    container.appendChild(commentSlide);

    activateEvents();
    showSlide(0);
}

function activateEvents(){

    document.querySelectorAll(".staff-item").forEach(item => {

        item.addEventListener("click", function(){

            const key = this.dataset.key;
            const parent = this.closest(".card");

            parent.querySelectorAll(".staff-item").forEach(el => {
                el.classList.remove("active");
            });

            this.classList.add("active");

            parent.querySelector(`input[name="${key}_petugas"]`).value = this.dataset.name;
        });
    });

    document.querySelectorAll(".rating").forEach(rating => {

        const stars = rating.querySelectorAll("i");
        const key = rating.dataset.key;

        stars.forEach(star => {

            star.addEventListener("click", () => {

                const value = star.dataset.value;

                document.querySelector(`input[name="${key}_rating"]`).value = value;

                stars.forEach(s => s.classList.remove("active"));

                stars.forEach(s => {
                    if(parseInt(s.dataset.value) <= value){
                        s.classList.add("active");
                    }
                });
            });

        });

    });

}

function showSlide(index){

    const slides = document.querySelectorAll(".slide");

    slides.forEach(slide => slide.classList.remove("active"));

    slides[index].classList.add("active");

    currentSlide = index;

    document.getElementById("prevBtn").style.display =
        currentSlide === 0 ? "none" : "block";

    document.getElementById("nextBtn").style.display =
        currentSlide === slides.length - 1 ? "none" : "block";

    const progress = ((currentSlide + 1) / slides.length) * 100;
    document.getElementById("progressBar").style.width = progress + "%";
}

function validateSlide(index){

    if(index >= sections.length) return true;

    const section = sections[index];

    const petugas = document.querySelector(`input[name="${section.key}_petugas"]`).value;
    const rating = document.querySelector(`input[name="${section.key}_rating"]`).value;

    if(!petugas || !rating){

        Swal.fire({
            icon:"warning",
            title:"Penilaian Belum Lengkap",
            text:`Silakan pilih petugas dan berikan penilaian untuk ${section.title}.`,
            confirmButtonColor:"#D4AF37"
        });

        return false;
    }

    return true;
}

document.getElementById("nextBtn").addEventListener("click", () => {

    if(validateSlide(currentSlide)){
        showSlide(currentSlide + 1);
    }

});

document.getElementById("prevBtn").addEventListener("click", () => {
    showSlide(currentSlide - 1);
});

document.getElementById("surveyForm").addEventListener("submit", async function(e){

    e.preventDefault();

    // Validasi semua slide
    for(let i = 0; i < sections.length; i++){

        const valid = validateSlide(i);

        if(!valid){
            showSlide(i);
            return;
        }
    }

    const form = e.target;

    const data = {};

    sections.forEach(sec => {

        data[`${sec.key}_petugas`] =
            form[`${sec.key}_petugas`].value;

        data[`${sec.key}_rating`] =
            form[`${sec.key}_rating`].value;
    });

    data.komentar = form.komentar.value;

    const btn = document.getElementById("submitBtn");

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';

    try{

        const response = await fetch(SCRIPT_URL,{
            method:"POST",
            body:JSON.stringify(data)
        });

        if(!response.ok) throw new Error();

        Swal.fire({
            icon:"success",
            title:"Terima Kasih",
            text:"Penilaian berhasil dikirim.",
            confirmButtonColor:"#D4AF37"
        });

        location.reload();

    }catch(err){

        Swal.fire({
            icon:"error",
            title:"Gagal",
            text:"Data gagal dikirim. Periksa Apps Script atau koneksi internet.",
            confirmButtonColor:"#D4AF37"
        });

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Penilaian';
    }

});

loadPetugas();
